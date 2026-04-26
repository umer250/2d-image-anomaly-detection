"""add foreign key indexes for performance

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-04-26 00:01:00.000000

"""
from alembic import op

revision = 'f2a3b4c5d6e7'
down_revision = 'e1f2a3b4c5d6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # history.user_id — most queried FK (user history lookups)
    op.create_index('ix_history_user_id', 'history', ['user_id'], unique=False)
    # images.user_id
    op.create_index('ix_images_user_id', 'images', ['user_id'], unique=False)
    # results.image_id
    op.create_index('ix_results_image_id', 'results', ['image_id'], unique=False)
    # history.created_at — used heavily in analytics date range queries
    op.create_index('ix_history_created_at', 'history', ['created_at'], unique=False)
    # history.status — used in anomaly/normal count queries
    op.create_index('ix_history_status', 'history', ['status'], unique=False)
    # history.category — used in per-category breakdown queries
    op.create_index('ix_history_category', 'history', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_history_category', table_name='history')
    op.drop_index('ix_history_status', table_name='history')
    op.drop_index('ix_history_created_at', table_name='history')
    op.drop_index('ix_results_image_id', table_name='results')
    op.drop_index('ix_images_user_id', table_name='images')
    op.drop_index('ix_history_user_id', table_name='history')
