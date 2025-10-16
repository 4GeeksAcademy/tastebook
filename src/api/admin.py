import os
import random
from collections import deque
from datetime import datetime
from typing import Dict, List
from uuid import uuid4

from faker import Faker # Module to generate fake data for testing

from flask import current_app, flash, redirect, request, url_for
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_admin.menu import MenuLink
from flask_login import LoginManager, current_user, login_user, logout_user
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

from .models import db, User, Recipe, RecipeImage, Follow, RecipeComment, RecipeLike, CommentLike, Collection, CollectionRecipe, Chat, Message
from .countries import get_random_country

faker = Faker()
login_manager = LoginManager()
login_manager.session_protection = 'strong'

_activity_stream = deque(maxlen=40)


def log_admin_event(event: str, category: str = 'info', meta: Dict | None = None) -> None:
    """Append an admin event to the in-memory activity stream."""
    _activity_stream.appendleft({
        'event': event,
        'category': category,
        'meta': meta or {},
        'timestamp': datetime.utcnow()
    })


def _env_list(name: str) -> List[str]:
    raw_value = os.getenv(name, '')
    return [item.strip() for item in raw_value.split(',') if item.strip()]


def _safe_int(value, default: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(parsed, maximum))


class AdminPolicy:
    """Centralises admin access rules so I can tweak them easily."""

    def is_admin(self, user: User | None) -> bool:
        if not user or not getattr(user, 'is_active', False):
            return False

        if getattr(user, 'is_admin', False):
            return True

        email_whitelist = {email.lower() for email in _env_list('ADMIN_EMAIL_WHITELIST')}
        if email_whitelist and getattr(user, 'email', '').lower() in email_whitelist:
            return True

        id_whitelist = set(_env_list('ADMIN_USER_IDS'))
        if id_whitelist and str(getattr(user, 'id', '')) in id_whitelist:
            return True

        allow_dev_override = os.getenv('ADMIN_ALLOW_ALL_IN_DEV', '0') == '1'
        environment = current_app.config.get('ENV', 'production') if current_app else os.getenv('FLASK_ENV', 'production')
        if allow_dev_override and environment != 'production':
            return True

        return False


admin_policy = AdminPolicy()


class SecureModelView(ModelView):
    """ModelView that enforces admin authentication."""

    def is_accessible(self):
        return current_user.is_authenticated and admin_policy.is_admin(current_user)

    def inaccessible_callback(self, name, **kwargs):  # pragma: no cover - flask-admin hook
        flash('Please sign in with an administrator account to continue.', 'warning')
        return redirect(url_for('admin.login', next=request.url))


class DashboardAdminIndexView(AdminIndexView):
    """Custom admin landing page with quick stats and utilities."""

    # Dashboard statistics
    @expose('/')
    def index(self):
        if not admin_policy.is_admin(current_user):
            return redirect(url_for('.login', next=request.url))

        stats = {
            'users':    db.session.query(func.count(User.id)).scalar() or 0,
            'recipes':  db.session.query(func.count(Recipe.id)).scalar() or 0,
            'comments': db.session.query(func.count(RecipeComment.id)).scalar() or 0,
            'likes':    db.session.query(func.count(RecipeLike.id)).scalar() or 0,
        }

        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_recipes = Recipe.query.order_by(Recipe.created_at.desc()).limit(5).all()
        top_countries = (
            db.session.query(
                User.country.op('->>')('code').label('code'),
                User.country.op('->>')('name').label('name'),
                func.count(User.id).label('total')
            )
            .filter(User.country.isnot(None))
            .group_by(User.country.op('->>')('code'), User.country.op('->>')('name'))
            .order_by(func.count(User.id).desc())
            .limit(5)
            .all()
        )

        # Convert to the expected format for the template
        top_countries = [
            ({'code': row.code, 'name': row.name}, row.total)
            for row in top_countries
        ]

        return self.render(
            'admin/dashboard.html',
            stats          = stats,
            recent_users   = recent_users,
            recent_recipes = recent_recipes,
            top_countries  = top_countries,
            activity       = list(_activity_stream),
            test_password  = os.getenv('ADMIN_TEST_USER_PASSWORD', 'Tastebook123!'),
            environment    = current_app.config.get('ENV', 'production')
        )


    # Login page
    @expose('/login', methods=['GET', 'POST'])
    def login(self):
        if current_user.is_authenticated and admin_policy.is_admin(current_user):
            return redirect(request.args.get('next') or url_for('.index'))

        if request.method == 'POST':
            email    = (request.form.get('email') or '').strip().lower()
            password = request.form.get('password') or ''
            remember = bool(request.form.get('remember'))

            user = User.query.filter(func.lower(User.email) == email).first()
            if not user or not check_password_hash(user.hashed_psswrd, password):
                flash('Invalid email or password.', 'danger')
            elif not admin_policy.is_admin(user):
                flash('This account does not have administrator privileges.', 'danger')
            else:
                login_user(user, remember=remember)
                log_admin_event('Admin login', 'success', {'email': user.email})
                flash('Welcome back, administrator!', 'success')
                target = request.args.get('next') or url_for('.index')
                return redirect(target)

        return self.render('admin/login.html')


    # Logout page
    @expose('/logout')
    def logout(self):
        if current_user.is_authenticated:
            log_admin_event('Admin logout', 'info', {'email': current_user.email})
            logout_user()
        flash('Signed out successfully.', 'info')
        return redirect(url_for('.login'))


    # Action: Create test users
    @expose('/actions/create-test-users', methods=['POST'])
    def create_test_users(self):
        if not admin_policy.is_admin(current_user):
            return redirect(url_for('.login', next=request.url))

        count = _safe_int(request.form.get('count'), default=5, minimum=1, maximum=50)
        created = AdminDataSeeder.create_test_users(count)
        flash(f'Created {created} test users.', 'success')
        log_admin_event('Created test users', 'success', {'count': created})
        return redirect(url_for('.index'))


    # Action: Create test recipes
    @expose('/actions/create-test-recipes', methods=['POST'])
    def create_test_recipes(self):
        if not admin_policy.is_admin(current_user):
            return redirect(url_for('.login', next=request.url))

        count = _safe_int(request.form.get('count'), default=5, minimum=1, maximum=50)
        created = AdminDataSeeder.create_test_recipes(count)
        if created:
            flash(f'Created {created} sample recipes.', 'success')
            log_admin_event('Created sample recipes', 'success', {'count': created})
        else:
            flash('Could not create recipes. Please ensure there are users to assign as authors.', 'warning')
            log_admin_event('Failed to create sample recipes', 'warning')
        return redirect(url_for('.index'))


    # Action: Purge test data
    @expose('/actions/purge-test-data', methods=['POST'])
    def purge_test_data(self):
        if not admin_policy.is_admin(current_user):
            return redirect(url_for('.login', next=request.url))

        removed = AdminDataSeeder.purge_test_data()
        flash(f"Removed {removed['users']} test users and {removed['recipes']} sample recipes.", 'info')
        log_admin_event('Purged test data', 'info', removed)
        return redirect(url_for('.index'))


    # Action: Purge ALL data
    @expose('/actions/purge-all-data', methods=['POST'])
    def purge_all_data(self):
        if not admin_policy.is_admin(current_user):
            return redirect(url_for('.login', next=request.url))

        removed = AdminDataSeeder.purge_all_data()
        total_items = sum(removed.values())
        flash(f'Database purged successfully! Removed {total_items} total items: {removed["users"]} users, {removed["recipes"]} recipes, {removed["comments"]} comments, {removed["likes"]} likes, and all related data.', 'warning')
        log_admin_event('Purged ALL database data', 'warning', removed)
        return redirect(url_for('.index'))


    # Action: Total database reset
    @expose('/actions/total-database-reset', methods=['POST'])
    def total_database_reset(self):
        if not admin_policy.is_admin(current_user):
            return redirect(url_for('.login', next=request.url))

        current_app.logger.info('🔄 Admin dashboard: Total database reset requested')

        # Check environment - be extra careful in production
        environment = current_app.config.get('ENV', 'production') if current_app else os.getenv('FLASK_ENV', 'production')
        is_production = environment == 'production'

        current_app.logger.info(f'Environment detected: {environment} (is_production: {is_production})')

        if is_production:
            current_app.logger.info('Production environment - checking confirmation')
            # In production, require explicit confirmation
            confirm_reset = request.form.get('confirm_total_reset', '').lower() == 'yes'
            current_app.logger.info(f'Confirmation checkbox value: {request.form.get("confirm_total_reset", "")} (confirmed: {confirm_reset})')
            if not confirm_reset:
                current_app.logger.warning('Production confirmation failed - redirecting back')
                flash('⚠️ Production database reset requires explicit confirmation. Please check the confirmation box.', 'danger')
                return redirect(url_for('.index'))

        current_app.logger.info('Starting database reset process...')
        try:
            result = AdminDataSeeder.total_database_reset()
            current_app.logger.info('Database reset completed successfully')
            log_admin_event('Total database reset completed', 'success', {'environment': environment})
            flash(f'🗑️ {result["message"]}! All tables dropped and recreated. Auto-increment IDs reset to 1. Admin account recreated.', 'success')
            return redirect(url_for('.index'))

        except ValueError as e:
            current_app.logger.error(f'Configuration error: {str(e)}')
            log_admin_event('Total database reset failed - missing config', 'danger', {'error': str(e)})
            flash(f'Configuration error: {str(e)}', 'danger')
            return redirect(url_for('.index'))

        except Exception as e:
            current_app.logger.error(f'Database reset failed: {str(e)}', exc_info=True)
            log_admin_event('Total database reset failed', 'danger', {'error': str(e)})
            flash(f'Total database reset failed: {str(e)}', 'danger')
            return redirect(url_for('.index'))


# Data seeding and cleanup
class AdminDataSeeder:
    """Utility helpers to populate and clean development data."""

    USER_PREFIX   = 'testuser'
    RECIPE_PREFIX = 'Sample Recipe'

    @classmethod
    def create_test_users(cls, count: int) -> int:
        created  = 0
        password = os.getenv('ADMIN_TEST_USER_PASSWORD', 'Tastebook123!')

        for _ in range(count):
            suffix   = uuid4().hex[:6]
            username = f"{cls.USER_PREFIX}_{suffix}"
            email    = f"{cls.USER_PREFIX}.{suffix}@example.com"

            if User.query.filter((User.username == username) | (User.email == email)).first():
                continue

            user = User(
                email         = email,
                username      = username,
                full_name     = faker.name(),
                description   = faker.sentence(nb_words=12),
                country       = get_random_country(),
                is_active     = True,
                is_admin      = False,
                plain_psswrd  = password if current_app.config.get('ENV') != 'production' else None,
                hashed_psswrd = generate_password_hash(password)
            )

            db.session.add(user)
            created += 1

        if created:
            db.session.commit()

        return created

    @classmethod
    def create_test_recipes(cls, count: int) -> int:
        user_ids = [u.id for u in User.query.filter_by(is_active=True).all()]
        if not user_ids:
            return 0

        created = 0

        for _ in range(count):
            author_id   = random.choice(user_ids)
            title       = f"{cls.RECIPE_PREFIX} {faker.word().title()}"[:100]
            description = faker.paragraph(nb_sentences=3)
            ingredients = [
                {
                    'ingredient': faker.word(),
                    'quantity':   random.randint(1, 4),
                    'unit':       random.choice(['cups', 'tsp', 'tbsp', 'grams'])
                }
                for _ in range(random.randint(3, 6))
            ]
            instructions = [
                faker.sentence(nb_words=12)
                for _ in range(random.randint(3, 5))
            ]

            recipe = Recipe(
                author_id    = author_id,
                title        = title,
                description  = description,
                ingredients  = ingredients,
                instructions = instructions,
                is_public    = True
            )

            db.session.add(recipe)
            created += 1

        if created:
            db.session.commit()

        return created

    @classmethod
    def purge_test_data(cls) -> Dict[str, int]:

        # Remove recipes and users created by the seeder
        recipe_query = Recipe.query.filter(Recipe.title.like(f"{cls.RECIPE_PREFIX}%"))
        recipes_removed = recipe_query.count()

        # Remove all test recipes
        user_query = User.query.filter(User.username.like(f"{cls.USER_PREFIX}_%"))
        users_removed = user_query.count()

        # Cascade deletions will clean up related data (comments, likes, follows, etc.)
        if recipes_removed:
            recipe_query.delete(synchronize_session=False)
        if users_removed:
            user_query.delete(synchronize_session=False)

        # Commit if we removed anything
        if recipes_removed or users_removed:
            db.session.commit()

        return {'recipes': recipes_removed, 'users': users_removed}

    @classmethod
    def purge_all_data(cls) -> Dict[str, int]:
        """
        Purge ALL data from the database except admin users.
        This removes all non-admin users and all related data (recipes, comments, likes, etc.).
        Admin users are preserved to maintain access to the admin panel.
        """
        # Count what we're about to remove for reporting
        stats = {
            'users':              User.query.filter(User.is_admin == False).count(),
            'recipes':            Recipe.query.count(),
            'comments':           RecipeComment.query.count(),
            'likes':              RecipeLike.query.count(),
            'comment_likes':      CommentLike.query.count(),
            'follows':            Follow.query.count(),
            'collections':        Collection.query.count(),
            'collection_recipes': CollectionRecipe.query.count(),
            'recipe_images':      RecipeImage.query.count(),
            'chats':              Chat.query.count(),
            'messages':           Message.query.count()
        }

        # Delete in order to respect foreign key constraints
        # Start with dependent tables first, then work up to users
        
        # 1. Delete messages first (depends on chats and users)
        Message.query.delete(synchronize_session=False)
        
        # 2. Delete chats (depends on users)
        Chat.query.delete(synchronize_session=False)
        
        # 3. Delete collection recipes (junction table between collections and recipes)
        CollectionRecipe.query.delete(synchronize_session=False)
        
        # 4. Delete collections (depends on users)
        Collection.query.delete(synchronize_session=False)
        
        # 5. Delete comment likes (depends on comments and users)
        CommentLike.query.delete(synchronize_session=False)
        
        # 6. Delete recipe comments (depends on recipes and users)
        RecipeComment.query.delete(synchronize_session=False)
        
        # 7. Delete recipe likes (depends on recipes and users)
        RecipeLike.query.delete(synchronize_session=False)
        
        # 8. Delete recipe images (depends on recipes)
        RecipeImage.query.delete(synchronize_session=False)
        
        # 9. Delete recipes (depends on users)
        Recipe.query.delete(synchronize_session=False)
        
        # 10. Delete follows (depends on users)
        Follow.query.delete(synchronize_session=False)
        
        # 11. Finally, delete non-admin users
        User.query.filter(User.is_admin == False).delete(synchronize_session=False)
        
        # Commit all deletions
        db.session.commit()
        
        return stats

    @classmethod
    def total_database_reset(cls) -> Dict[str, str]:
        """
        Perform a complete database reset by dropping and recreating all tables.
        This resets auto-increment counters and applies any schema changes.
        WARNING: This is destructive and should only be used in development!
        """
        # Get admin credentials
        admin_email     = os.getenv('ADMIN_SEED_EMAIL')
        admin_password  = os.getenv('ADMIN_SEED_PASSWORD')
        admin_username  = os.getenv('ADMIN_SEED_USERNAME',  'tastebook-admin')
        admin_full_name = os.getenv('ADMIN_SEED_FULL_NAME', 'Tastebook Administrator')

        current_app.logger.info('🔄 Starting total database reset...')
        current_app.logger.info(f'Admin credentials: email={admin_email}, username={admin_username}')

        if not admin_email or not admin_password:
            current_app.logger.error('Missing admin credentials: ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set')
            raise ValueError('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD environment variables must be set')

        try:
            current_app.logger.info('Closing all database connections...')
            # Close all active sessions and connections before dropping tables
            db.session.close_all()
            db.engine.dispose()
            current_app.logger.info('All connections closed')

            current_app.logger.info('Dropping all tables...')
            try:
                # First try the normal SQLAlchemy approach
                db.drop_all()
                current_app.logger.info('All tables dropped successfully via SQLAlchemy')
            except Exception as drop_error:
                current_app.logger.warning(f'SQLAlchemy drop_all failed: {drop_error}, trying raw SQL approach')
                # Fallback: use raw SQL to drop tables (SQLite specific)
                with db.engine.connect() as conn:
                    # Get all table names
                    result = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                    tables = [row[0] for row in result.fetchall()]
                    
                    current_app.logger.info(f'Found tables to drop: {tables}')
                    
                    # Drop tables in reverse order to handle foreign keys
                    for table in reversed(tables):
                        try:
                            conn.execute(f"DROP TABLE IF EXISTS {table}")
                            current_app.logger.info(f'Dropped table: {table}')
                        except Exception as table_error:
                            current_app.logger.warning(f'Failed to drop table {table}: {table_error}')
                    
                    # Reset sequences (auto-increment counters)
                    conn.execute("DELETE FROM sqlite_sequence")
                    conn.commit()
                    
                current_app.logger.info('All tables dropped successfully via raw SQL')

            current_app.logger.info('Recreating database engine connection...')
            # Ensure clean connection state
            db.engine.dispose()
            current_app.logger.info('Engine disposed and recreated')

            current_app.logger.info('Creating all tables...')
            # Recreate all tables with fresh schema
            db.create_all()
            current_app.logger.info('All tables created successfully')

            current_app.logger.info('Creating admin user...')
            # Recreate the admin account
            admin_user = User(
                email          = admin_email,
                username       = admin_username,
                full_name      = admin_full_name,
                description    = 'Auto-created admin account after database reset',
                country        = {'code': "ES", 'name': "Spain"},
                is_active      = True,
                is_admin       = True,
                plain_psswrd   = admin_password if current_app.config.get('ENV') != 'production' else None,
                hashed_psswrd  = generate_password_hash(admin_password),
                cloudinary_url    = "https://res.cloudinary.com/dqzbwmbap/image/upload/v1760594180/tastebook/users/1/spczs7xv19nqrkjhvez5.png",
                cloudinary_img_id = "tastebook/users/1/spczs7xv19nqrkjhvez5"
            )

            current_app.logger.info(f'Adding admin user to session: {admin_user.email}')
            db.session.add(admin_user)

            current_app.logger.info('Committing admin user...')
            db.session.commit()
            current_app.logger.info('Admin user committed successfully')

            result = {
                'status': 'success',
                'message': 'Database reset completed successfully',
                'admin_email': admin_email
            }
            current_app.logger.info(f'✅ Database reset completed: {result}')
            return result

        except Exception as e:
            current_app.logger.error(f'❌ Database reset failed: {str(e)}', exc_info=True)
            db.session.rollback()
            current_app.logger.info('Database session rolled back')
            raise Exception(f'Database reset failed: {str(e)}')


@login_manager.user_loader
def load_admin_user(user_id: str):  # pragma: no cover - flask-login hook
    try:
        return User.query.get(int(user_id))
    except (TypeError, ValueError):
        return None


def ensure_admin_account(app) -> User | None:
    """Ensure there is at least one administrator user for the control panel."""
    email     = os.getenv('ADMIN_SEED_EMAIL')
    password  = os.getenv('ADMIN_SEED_PASSWORD')
    username  = os.getenv('ADMIN_SEED_USERNAME',  'tastebook-admin')
    full_name = os.getenv('ADMIN_SEED_FULL_NAME', 'Tastebook Administrator')

    if not email or not password:
        return None

    with app.app_context():
        # Check if User table exists before trying to query
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'users' not in inspector.get_table_names():
            # Tables don't exist yet, skip admin account creation
            return None
            
        existing = User.query.filter(func.lower(User.email) == email.lower()).first()
        if existing:
            if not existing.is_admin:
                existing.is_admin = True
                db.session.commit()
                log_admin_event('Promoted existing user to admin', 'info', {'email': email})
            return existing

        unique_username = username
        collision_counter = 1
        while User.query.filter_by(username=unique_username).first():
            unique_username = f"{username}{collision_counter}"
            collision_counter += 1

        user = User(
            email         = email,
            username      = unique_username,
            full_name     = full_name,
            description   = 'Auto-created admin account',
            country       = None,
            is_active     = True,
            is_admin      = True,
            plain_psswrd  = password if app.config.get('ENV') != 'production' else None,
            hashed_psswrd = generate_password_hash(password)
        )

        db.session.add(user)
        db.session.commit()
        log_admin_event('Seeded primary admin user', 'success', {'email': email})
        return user


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cyborg' # https://bootswatch.com/cyborg/

    login_manager.init_app(app)
    login_manager.login_view             = 'admin.login'
    login_manager.login_message          = 'Please log in to access the admin console.'
    login_manager.login_message_category = 'warning'

    admin_template_dir = os.path.join(os.path.dirname(__file__), 'templates')
    if app.jinja_loader and admin_template_dir not in app.jinja_loader.searchpath:
        app.jinja_loader.searchpath.append(admin_template_dir)

    ensure_admin_account(app)


    admin = Admin(
        app,
        name          = 'TasteBook Admin',
        index_view    =  DashboardAdminIndexView(name='Dashboard'),
        template_mode = 'bootstrap3'
    )


    class UserAdmin(SecureModelView):
        column_list            = ['id','is_admin', 'email', 'username', 'full_name', 'country', 'is_active', 'plain_psswrd', 'created_at', 'cloudinary_img_id', 'cloudinary_url']  
        column_searchable_list = [                 'email', 'username', 'full_name']
        column_filters         = [     'is_admin',                                              'is_active',                 'created_at']
        column_default_sort    =                                                                                            ('created_at', False)
        column_formatters      = {
            'created_at': lambda _v, _c, m, _p: m.created_at.strftime('%Y-%m-%d %H:%M') if m.created_at else '—',
            'country':    lambda _v, _c, m, _p: f"{m.country.get('name', '—')} ({m.country.get('code', '—')})" if m.country else '—'
        }
        form_columns           = ['email', 'username', 'full_name', 'description', 'country', 'is_active', 'is_admin', 'plain_psswrd', 'cloudinary_url', 'cloudinary_img_id']
        form_widget_args       = {
            'plain_psswrd': {
                'placeholder': 'Leave blank to keep current password'
            }
        }

        def on_model_change(self, form, model, is_created):
            password = form.plain_psswrd.data
            if is_created and not password:
                raise ValueError('A password is required when creating a new user.')
            if password:
                model.hashed_psswrd = generate_password_hash(password)
            super().on_model_change(form, model, is_created)


    class RecipeAdmin(SecureModelView):
        column_list            = ['id', 'is_public', 'author_id', 'title',                                              'created_at']
        column_searchable_list = [                                'title', 'description']                               
        column_filters         = [      'is_public', 'author_id',                                                       'created_at']
        column_default_sort    = (                                                                                      'created_at', True)
        form_columns           = [      'is_public', 'author_id', 'title', 'description', 'ingredients', 'instructions']

    class RecipeImageAdmin(SecureModelView):
        column_list    = ['id', 'recipe_id', 'is_primary', 'url',             'display_order', 'uploaded_at']
        column_filters = [      'recipe_id', 'is_primary',                                     'uploaded_at']
        form_columns   = [      'recipe_id', 'is_primary', 'url', 'image_id', 'display_order']

    class FollowAdmin(SecureModelView):
        column_list    = ['id', 'follower_id', 'followed_id', 'created_at']
        column_filters = [      'follower_id', 'followed_id', 'created_at']
        form_columns   = [      'follower_id', 'followed_id']

    class RecipeCommentAdmin(SecureModelView):
        column_list            = ['id', 'user_id', 'recipe_id', 'parent_comment_id', 'is_pinned', 'content', 'is_edited', 'created_at']
        column_searchable_list =                                                                 ['content']
        column_filters         = [      'user_id', 'recipe_id',                      'is_pinned',            'is_edited', 'created_at']
        form_columns           = [      'user_id', 'recipe_id', 'parent_comment_id',              'content', 'is_edited', 'is_pinned']

    class RecipeLikeAdmin(SecureModelView):
        column_list    = ['id', 'user_id', 'recipe_id', 'created_at']
        column_filters = [      'user_id', 'recipe_id', 'created_at']
        form_columns   = [      'user_id', 'recipe_id']
      
    class CommentLikeAdmin(SecureModelView):
        column_list    = ['id', 'user_id', 'comment_id', 'created_at']
        column_filters = [      'user_id', 'comment_id', 'created_at']
        form_columns   = [      'user_id', 'comment_id']


    # Register views
    admin.add_view( UserAdmin          (User,          db.session, name="Users"))
    # --
    admin.add_view( RecipeAdmin        (Recipe,        db.session, name="Recipes"))
    admin.add_view( RecipeImageAdmin   (RecipeImage,   db.session,                   category='Media'))
    # --
    admin.add_view( FollowAdmin        (Follow,        db.session,                   category='Engagement'))
    admin.add_view( RecipeLikeAdmin    (RecipeLike,    db.session,                   category='Engagement'))
    admin.add_view( RecipeCommentAdmin (RecipeComment, db.session,                   category='Engagement'))
    admin.add_view( CommentLikeAdmin   (CommentLike,   db.session,                   category='Engagement'))


    # Custom links
    admin.add_link( MenuLink( name='View Tastebook', url='/'))
    admin.add_link( MenuLink( name='Visit API Docs', url='/api'))


