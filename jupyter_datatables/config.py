# jupyter-datatables
# Copyright 2019 Marek Cermak <macermak@redhat.com>

"""Default configuration for Jupyter datatables tool."""

from collections import namedtuple

__all__ = ['defaults']


class DataTablesOptions(object):
    "Default options for Jupyter DataTables."

    columnDefs = [
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
    ]

    buttons = [
        'print', 'csv', 'pdf'
    ]

    order = []  # disable initial ordering
    ordering = True

    paging = True

    responsive = True

    scrollX = True
    scrollY = False

    searching = True

class DataTablesExtensions(object):
    """Default extensions for Jupyter DataTables."""

    buttons    = True
    responsive = True
    scroller   = True
    select     = True

class DataTablesConfig(object):
    """Default configuration for Jupyter DataTables."""

    classes = ['table', 'cell-border', 'nowrap']
    """Classes to be used for the resulting DataTable."""

    extensions = DataTablesExtensions

    options = DataTablesOptions

    limit = 1000
    """
    Take a sample after exceeding given limit
    
    :type int: limit number of rows of the table
    """
    sample_size = None

    sort = False
    """
    Sort dataTable by index or values
    
    :type bool: enable or disable sorting by index (default: False)
    :type str: sort by single column
    :type List[str]: sort by multiple column(s)
    """

    warnings = True


defaults = DataTablesConfig
