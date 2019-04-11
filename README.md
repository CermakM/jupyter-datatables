# Jupyter DataTables

Jupyter Notebook extension to levarage pandas DataFrames by integrating DataTables JS.


<br>

#### About

Data scientists and in fact many developers work with `pd.DataFrame` on daily basis to interpret data to process them. In my typical workflow. The common workflow is to display the dataframe, take a look at the data schema and then produce multiple plots to check the distribution of the data to have a clearer picture, perhaps search some data in the table, etc...

What if those distribution plots were part of the standard DataFrame and we had the ability to quickly search through the table with minimal effort? What if it was the default representation?

The jupyter-datatables uses [jupyter-require](https://github.com/CermakM/jupyter-require) to draw the table.

<br>

#### Installation

```bash
pip install jupyter-datatables
```

And enable the required extensions

```bash
jupyter nbextension install --sys --py jupyter_require
jupyter nbextension enable jupyter-require
```

<br>

#### Usage

```python
import numpy as np
import pandas as pd

from jupyter-datatables import init_datatables_mode

init_datatables_mode()
```

That's it, your default pandas representation will now use Jupyter DataTables!

```python
df = pd.DataFrame(np.abs(np.random.randn(50, 8)), columns=list(string.ascii_uppercase[:8]))
```

![Jupyter Datatables table representation](https://github.com/CermakM/jupyter-datatables/blob/master/assets/images/jupyter-datatables.png)

We can also handle wide tables with ease.

```python
df = pd.DataFrame(np.abs(np.random.randn(50, 20)), columns=list(string.ascii_uppercase[:20]))
```

![Jupyter Datatables wide table representation](https://github.com/CermakM/jupyter-datatables/blob/master/assets/images/jupyter-datatables-wide.png)

<br>
 
---

#### The future plans:

- provide distribution plots for different data types
- allow custom operations on the table:
    - edit column name
    - edit column type
- handle multi index
- handle nested data
- improve plotting:
    - performance and efficiency
    - customizable
    - resizable
    - dockable
    - draggable to a Jupyter cell (??)
    
- [stretch goal] increased performance and space efficiency by server-side processing -- lazy loading

---

> Author: Marek Cermak <macermak@redhat.com>, @AICoE - Project Thoth
