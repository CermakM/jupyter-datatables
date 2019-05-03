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
jupyter nbextension install --sys-prefix --py jupyter_require
jupyter nbextension enable jupyter-require/extension
```

<br>

#### Usage

```python
import numpy as np
import pandas as pd

from jupyter_datatables import init_datatables_mode

init_datatables_mode()
```

That's it, your default pandas representation will now use Jupyter DataTables!

```python
df = pd.DataFrame(np.abs(np.random.randn(50, 6)), columns=list(string.ascii_uppercase[:6]))
```

![Jupyter Datatables table representation](https://raw.github.com/CermakM/jupyter-datatables/master/assets/images/jupyter-datatables.png)

<br>

In most cases, you don't need to worry too much about the size of your data. Jupyter DataTables **calculates required sample size** based on a confidence interval (by default this would be `0.95`) and margin of error and ceils it to the highest 'smart' value.

For example, for a data containing `100,000` samples, given `0.975` confidence interval and `0.02` margin of error, the Jupyter DataTables would calculate that `3044` samples are required and it would round it up to `4000`.

![Jupyter Datatables long table sample size](https://raw.github.com/CermakM/jupyter-datatables/master/assets/images/jupyter-datatables-long.png)

With additional note:

> Sample size: 4,000 out of 100,000

<br>

We can also handle wide tables with ease.

```python
df = pd.DataFrame(np.abs(np.random.randn(50, 20)), columns=list(string.ascii_uppercase[:20]))
```

![Jupyter Datatables wide table representation](https://raw.github.com/CermakM/jupyter-datatables/master/assets/images/jupyter-datatables-wide.gif)

<br>

As per 0.2.0, there is a support for multiple dtypes like `object`, `categorical` and `datetime`.


```python
dft = pd.DataFrame({'A': np.random.rand(5),
                    'B': [1, 1, 3, 2, 1],
                    'C': 'foo',
                    'C_': 'This is a very long sentence that should automatically be trimmed',
                    'D': [
                        pd.Timestamp('20010101'), pd.Timestamp('20010102'),
                        pd.Timestamp('20010103'), pd.Timestamp('20010103'),
                        pd.Timestamp('20010104')
                    ],
                    'E': pd.Series([1.0] * 5).astype('float32'),
                    'F': [False, True, False, False, True],
                    'G': pd.Series([1] * 5, dtype='int8')}
                  )
```
![Jupyter Datatables multiple dtypes representation](https://raw.github.com/CermakM/jupyter-datatables/master/assets/images/jupyter-datatables-dtypes.gif)
 
---

<br>

#### The future plans:

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
