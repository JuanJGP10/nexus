"""add day_of_week to tasks

Revision ID: 78d87219eadd
Revises: c884d3db0ffc
Create Date: 2026-09-15 20:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78d87219eadd'
down_revision: Union[str, Sequence[str], None] = 'c884d3db0ffc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    day_of_week_enum = sa.Enum(
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        name='day_of_week',
    )
    day_of_week_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('tasks', sa.Column('day_of_week', day_of_week_enum, nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tasks', 'day_of_week')
    sa.Enum(name='day_of_week').drop(op.get_bind(), checkfirst=True)
