# jupyter-datatables
# Copyright 2019 Marek Cermak <macermak@redhat.com>
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

"""Jupyter interactive pandas DataFrame representation."""

import hashlib
import json
import math
import typing
import warnings

import numpy as np
import pandas as pd

from collections import OrderedDict
from functools import partialmethod

from pathlib import Path

from jupyter_require import require

from jupyter_require import link_css
from jupyter_require import load_css
from jupyter_require import load_js

from jupyter_require import safe_execute
from jupyter_require import execute_with_requirements

from . import config
from .__about__ import __version__

__all__ = ['config', 'init_datatables_mode', '__version__']

_HERE = Path(__file__).parent


def init_datatables_mode(options: dict = None, classes: list = None):
    """Initialize DataTable mode for pandas DataFrame representation."""
    # extensions to be loaded
    extensions = config.defaults.extensions

    require("d3", "https://d3js.org/d3.v5.min")
    require("d3-array", "https://d3js.org/d3-array.v2.min")

    require.config(**{
        "paths": {
            "moment": "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.0/moment",
            "chartjs": "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart"
        },
        "shim": {
            "chartjs": {
                "deps": ["moment"]  # enforce moment to be loaded before chartjs
            }
        },
    })

    # configure path to the datatables library using requireJS
    libs = OrderedDict(
        {
            "datatables.net": "https://cdn.datatables.net/1.10.18/js/jquery.dataTables"  # FIXME: minified version on prod
        }
    )
    shim = OrderedDict({"datatables.net": {"exports": "$.fn.dataTable"}})

    bundles = OrderedDict()

    if extensions.buttons:
        lib = "datatables.net-buttons"

        libs[lib] = "https://cdn.datatables.net/buttons/1.5.6/js/dataTables.buttons.min"
        shim[lib] = {"deps": ["datatables.net"]}

        # required to export Excel file, must be loaded first
        libs["jszip"] = "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min"

        bundles[lib] = {
            "buttons.colvis": "https://cdn.datatables.net/buttons/1.5.6/js/buttons.colVis.min",
            "buttons.flash": "https://cdn.datatables.net/buttons/1.5.6/js/buttons.flash.min",
            "buttons.html5": "https://cdn.datatables.net/buttons/1.5.6/js/buttons.html5.min",
            "buttons.print": "https://cdn.datatables.net/buttons/1.5.6/js/buttons.print.min",
        }
        for bundle, path in bundles[lib].items():
            libs[bundle] = path
            shim[bundle] = {"deps": ["jszip", lib]}

        # requirements for correct Buttons functionality
        libs[
            "pdfmake"
        ] = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/pdfmake.min"
        shim["pdfmake"] = {"deps": ["datatables.net"]}
        libs[
            "vfsfonts"
        ] = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/vfs_fonts"
        shim["vfsfonts"] = {"deps": ["datatables.net"]}

    if extensions.responsive:
        libs["datatables.responsive"] = (
            "https://cdn.datatables.net/" "responsive/2.2.2/js/dataTables.responsive.min"
        )  # Responsive

    if extensions.scroller:
        libs["datatables.scroller"] = (
            "https://cdn.datatables.net/" "scroller/2.0.0/js/dataTables.scroller.min"
        )  # Scroll

    if extensions.select:
        libs["datatables.select"] = (
            "https://cdn.datatables.net/" "select/1.3.0/js/dataTables.select.min"
        )  # Select

    require.config(paths=libs, shim=shim)

    # link stylesheets
    link_css(
        "https://cdn.datatables.net/v/dt/"
        "dt-1.10.18/"  # DataTables
        "af-2.3.3/"  # AutoFill
        "b-1.5.6/"  # Buttons
        "b-colvis-1.5.6/"  # Buttons - Column Visibility
        "b-flash-1.5.6/"  # Buttons - Flash
        "b-html5-1.5.6/"  # Buttons - HTML5
        "b-print-1.5.6/"  # Buttons - Print View
        "cr-1.5.0/"  # ColReorder
        "fc-3.2.5/"  # FixedColumns
        "fh-3.1.4/"  # FixedHeader
        "kt-2.5.0/"  # KeyTable
        "r-2.2.2/"  # Responsive
        "rg-1.1.0/"  # RowGroup
        "rr-1.2.4/"  # RowReorder
        "sc-2.0.0/"  # Scroll
        "sl-1.3.0/"  # Select
        "datatables.min.css",
        {"id": "datatables.min.css"},
    )

    # load custom style
    load_css(
        Path(_HERE, "css/jupyter-datatables.css").read_text(encoding="utf-8"),
        {"id": "jupyter-datatables-css"},
    )

    load_js(
        Path(_HERE, "js/config.js").read_text(encoding="utf-8"),
        {"id": "dt-config-js"})

    load_js(
        Path(_HERE, "js/components.js").read_text(encoding="utf-8"),
        {"id": "dt-components-js"})

    load_js(
        Path(_HERE, "js/graph-objects.js").read_text(encoding="utf-8"),
        {"id": "dt-graph-objects-js"})

    load_js(
        Path(_HERE, "js/toolbar.js").read_text(encoding="utf-8"),
        {"id": "dt-toolbar-js"})

    load_js(
        Path(_HERE, "js/tooltips.js").read_text(encoding="utf-8"),
        {"id": "dt-tooltips-js"})

    load_js(
        Path(_HERE, "js/jupyter-datatables.js").read_text(encoding="utf-8"),
        {"id": "jupyter-datatables-js"})

    pd.DataFrame._repr_javascript_ = partialmethod(
        _repr_datatable_, options=options, classes=classes
    )


def _repr_datatable_(self, options: dict = None, classes: list = None):
    """Return DataTable representation of pandas DataFrame."""
    if options is None:
        options = {}
        options.update({
            k: v for k, v in config.defaults.options.__dict__.items()
            if not k.startswith("_")
        })

    # column types
    options.update({'columnDefs': _get_columns_defs(self, options)})

    # pop buttons, we need to use them separately
    buttons = options.pop("buttons", [])
    classes = classes if classes is not None else " ".join(config.defaults.classes)

    script = """
    const settings = await appendDataTable(`$$html`, $$options, $$buttons, element);

    console.debug("DataTable successfully created.");
    """

    df = self
    sample_size = config.defaults.sample_size or len(self)

    if sample_size > len(df):
        raise ValueError(
            f"Sample size cannot be larger than length of the table: {sample_size} > {len(df)}"
        )

    adjusted =  False

    if config.defaults.limit is not None:
        n = len(self)

        # compute the sample size, it will be used for the data preview
        # to speed up computation
        if len(self) > config.defaults.limit:
            sample_size = getattr(config.defaults, 'sample_size', None) or min([
                n, _calculate_sample_size(n)
            ])

        idx = []
        # get 5% of extremes from each column to account for outliers in the sample
        # (if applicable)
        fraction = math.ceil(sample_size * 0.05)
        for col in self.columns:
            if self[col].dtype != "O":
                # for comfortable preview, take the first 10 samples (if applicable)
                idx.extend(self.index[:min(len(self), 10, sample_size)])
                idx.extend(self.nlargest(fraction, col).index)
                idx.extend(self.nsmallest(fraction, col).index)
        
        idx = set(idx)
        random_index  = self.index.difference(idx)
        random_sample = sample_size - min(len(idx), sample_size) if len(random_index) else 0

        sample_index = pd.Index({
            *idx,
            *np.random.choice(random_index, size=random_sample, replace=False)
        })
        adjusted = len(sample_index) != sample_size
        
        df = self.loc[sample_index].sort_index()

        sample_size = len(df)

    sort = config.defaults.sort
    if sort == True or sort == 'index':
        df.sort_index(inplace=True)
    elif sort:
        df.sort_values(inplace=True)

    sha = hashlib.sha256(
        df.to_json().encode()
    )
    digest = sha.hexdigest()

    html = df.to_html(classes=classes, table_id=digest)

    execute_with_requirements(
        script,
        required=[
            "base/js/events",
            "datatables.net",
            "d3",
            "chartjs",
            "dt-config",
            "dt-components",
            "dt-graph-objects",
            "dt-toolbar",
            "dt-tooltips",
            "jupyter-datatables"
        ],
        html=html,
        options=json.dumps(options),
        buttons=buttons,
    )

    # return script which links the scrollbars event after save
    safe_script = """
    setTimeout(() => {
        const table_id = '$$table_id';
        const table    = $(`#${table_id}_wrapper`);
        
        let scrollHead = table.find('div.dataTables_scrollHead');
        let scrollBody = table.find('div.dataTables_scrollBody');
        
        $(scrollBody).on(
            'scroll',
            (e) => {
                scrollHead.scrollLeft(scrollBody.scrollLeft());
            },
        );
    }, 200);
    """

    safe_execute(safe_script, table_id=digest)

    return f"""
    (function() {{
        const sample_size = Number({sample_size}).toLocaleString();
        const adjusted = Boolean('{adjusted}' == 'True')

        const total = Number({len(self)}).toLocaleString();

        element.append($('<p>').text(
            `Sample size: ${{sample_size}} out of ${{total}} ${{ adjusted ? "(adjusted)" : "" }}`));
    }}());
    """


def _get_columns_defs(df: pd.DataFrame, options: dict = None):
    """Create column defs to be used by DataTable constructor."""
    options = options or {}

    idx_cols = df.index.names
    col_defs = list(options.get('columnDefs', []))

    for i, dtype in enumerate(map(str, df.dtypes)):
        col_idx = i + len(idx_cols)
        col_def = {}

        append = True
        for d in col_defs:
            if d.get('targets', None) == col_idx:
                append = False
                col_def = d
                break

        col_def.update(type=dtype, targets=col_idx)
        if append:
            col_defs.append(col_def)
    
    return col_defs


def _calculate_sample_size(n, ci: float = 0.975, e: float = 0.02, p: float = 0.5) -> int:
    """Calculate representative sample size.

    :param ci: float, confidence interval, default = 0.975
    :param e: float, margin of error, default = 0.02
    :param p: float, population proportion, default = 0.5
    """
    try:
        from scipy import stats as st
    except ImportError:
        return math.sqrt(n)

    z = st.norm.ppf(1 - (1 - ci) / 2)
    u = z**2 * p * (1 - p) / e**2

    return _smart_ceil(u / (1 + u * math.pow(n, -1)))


def _smart_ceil(x: typing.Union[int, float], order: int = None) -> int:
    """Smart ceil to the nearest round integer.
    
    The 'nearest' is chosen based on the order of the given number
    """
    order = int(order) if order else len(str(math.ceil(x)))
    if order <= 0:
        raise ValueError("`order` must be integer >= 0")
    mod = math.pow(10, min([order, 3]))
    
    return int(x if x % mod == 0 else x + mod - x % mod)
