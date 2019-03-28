# jupyter-tools
# Copyright 2019 Marek Cermak <macermak@redhat.com>

"""Default configuration for Jupyter datatables tool."""

from collections import namedtuple

__all__ = ['defaults']


_DEFAULT_CONFIG = {
    'options': {
        'ordering': True,
        'paging': True,
        'scrollX': True,
        'scrollY': False,
        'searching': True,
    },
    'warnings': True,
}

DefaultDataTablesConfig = namedtuple('DefaultConfig', _DEFAULT_CONFIG.keys())

defaults = DefaultDataTablesConfig(**_DEFAULT_CONFIG)
"""Default configuration for Jupyter datatables tools."""
