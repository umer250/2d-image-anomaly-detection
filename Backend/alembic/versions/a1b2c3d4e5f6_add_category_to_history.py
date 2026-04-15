"""add category column to history

Revision ID: a1b2c3d4e5f6
Revises: 85e92479c5e9
Create Date: 2026-04-08 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '85e92479c5e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'history',
        sa.Column('category', sa.String(length=50), nullable=True, server_default='unknown')
    )


def downgrade() -> None:
    op.drop_column('history', 'category')
