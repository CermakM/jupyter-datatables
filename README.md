# Jupyter DataTables

<a href="https://mybinder.org/v2/gh/CermakM/jupyter-datatables/master?filepath=examples%2Fjupyter-datatables-0.4.0.ipynb"
   target="_parent">
   <img align="left"
      src="https://mybinder.org/badge_logo.svg">
</a>
<a href="https://nbviewer.jupyter.org/github/CermakM/jupyter-datatables/blob/master/examples/"
   target="_parent">
   <img
      src="https://raw.githubusercontent.com/jupyter/design/master/logos/Badges/nbviewer_badge.png"
      width="109" height="20">
</a>

Jupyter Notebook extension to leverage pandas DataFrames by integrating DataTables JS.



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
df = pd.DataFrame(np.abs(np.random.randn(50, 5)), columns=list(string.ascii_uppercase[:5]))
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

As per 0.3.0, there is a support for **interactive tooltips**:

![Jupyter Datatables wide table representation](https://raw.github.com/CermakM/jupyter-datatables/master/assets/images/jupyter-datatables-tooltips.gif)


And also support for custom indices including `Date` type:

```python
dft = pd.DataFrame({'A': np.random.rand(5),
                    'B': [1, 1, 3, 2, 1],
                    'C': 'This is a very long sentence that should automatically be trimmed',
                    'D': [pd.Timestamp('20010101'), pd.Timestamp('20010102'), pd.Timestamp('20010103'), pd.Timestamp('20010104'), pd.Timestamp('20010105')],
                    'E': pd.Series([1.0] * 5).astype('float32'),
                    'F': [False, True, False, False, True],
                   })

dft.D = dft.D.apply(pd.to_datetime)
dft.set_index('D', inplace=True)
```

![Jupyter Datatables wide table representation](https://raw.github.com/CermakM/jupyter-datatables/master/assets/images/jupyter-datatables-datetime-tooltips.gif)

---

<br>

#### Current status and future plans:

Check out the [Project Board](https://github.com/users/CermakM/projects/1) where we track issues and TODOs for our Jupyter tooling!

---

> Author: Marek Cermak <macermak@redhat.com>, @AICoE
