"""add hot_map_path contour_path comparison_path to history

Revision ID: d1e2f3a4b5c6
Revises: a1b2c3d4e5f6
Create Date: 2026-04-15 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('history', sa.Column('hot_map_path', sa.String(), nullable=True))
    op.add_column('history', sa.Column('contour_path', sa.String(), nullable=True))
    op.add_column('history', sa.Column('comparison_path', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('history', 'comparison_path')
    op.drop_column('history', 'contour_path')
    op.drop_column('history', 'hot_map_path')
