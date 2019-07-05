# jupyter-datatables
# Copyright 2019 Marek Cermak <macermak@redhat.com>

"""Default configuration for Jupyter datatables tool."""

from collections import namedtuple

__all__ = ['defaults']


Configuration = {
    'classes': ['table', 'cell-border', 'nowrap'],
    'options': {
        'columnDefs': [
            {
                # this is the first column, assuming this is index of the table
                'searchable': False,
                'width': '5%',
                'targets': 0,
            },
            {
                'targets': '_all',
                'className': 'dt-body-center dt-head-center'
            }
        ],
        'buttons': [
            'print', 'csv', 'pdf'
        ],

        'order': [],  # disable initial ordering
        'ordering': True,

        'paging': True,

        'responsive': True,

        'scrollX': True,
        'scrollY': False,

        'searching': True,
    },
    'extensions': {
        'buttons': True,
        'responsive': True,
        'scroller': True,
        'select': True
    },
    # Take a sample after exceeding given limit
    #
    # :type int: limit number of rows of the table
    'limit': 1000,
    'sample_size': None,
    # Sort dataTable by index or values
    #
    # :type bool: enable or disable sorting by index (default: False)
    # :type str: sort by single column
    # :type List[str]: sort by multiple column(s)
    'sort': False,
    'warnings': True,
}

DefaultDataTablesConfig = namedtuple('DefaultConfig', _DEFAULT_CONFIG.keys())

config = DefaultDataTablesConfig(**_DEFAULT_CONFIG)
"""Default configuration for Jupyter datatables tools."""
