from sqlalchemy import CheckConstraint


# Prevent self-referencing at deeper than one level (now enforced at DB layer)
### Note: This constraint is PostgreSQL-specific. For other DBs, enforce via app logic or triggers.

CheckConstraint("parent_comment_id IS NULL OR (SELECT c.parent_comment_id FROM comments c WHERE c.id = parent_comment_id) IS NULL", name='check_no_deep_comment_nesting')