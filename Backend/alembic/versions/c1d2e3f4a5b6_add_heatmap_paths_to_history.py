"""add heatmap paths to history

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-04-15

"""
from alembic import op
import sqlalchemy as sa

revision = 'c1d2e3f4a5b6'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('history', sa.Column('hot_map_path', sa.String(), nullable=True))
    op.add_column('history', sa.Column('contour_path', sa.String(), nullable=True))
    op.add_column('history', sa.Column('comparison_path', sa.String(), nullable=True))


def downgrade():
    op.drop_column('history', 'comparison_path')
    op.drop_column('history', 'contour_path')
    op.drop_column('history', 'hot_map_path')
