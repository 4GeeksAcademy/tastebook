cd /workspaces/tastebook && pipenv run python -c "
from src.app import app, db
from src.api.models import User
from sqlalchemy import func

with app.app_context():
    # Check if there are any users with countries
    users_with_countries = User.query.filter(User.country.isnot(None)).count()
    print(f'Users with countries: {users_with_countries}')
    
    if users_with_countries > 0:
        # Test the query
        try:
            result = db.session.query(
                User.country.op('->>')('code').label('code'),
                User.country.op('->>')('name').label('name'),
                func.count(User.id).label('total')
            ).filter(User.country.isnot(None)).group_by(
                User.country.op('->>')('code'), 
                User.country.op('->>')('name')
            ).order_by(func.count(User.id).desc()).limit(5).all()
            
            print(f'Query successful! Found {len(result)} country groups')
            for row in result[:3]:  # Show first 3
                print(f'  {row.name} ({row.code}): {row.total} users')
        except Exception as e:
            print(f'Query failed: {e}')
    else:
        print('No users with countries found - query would work but return empty results')
"