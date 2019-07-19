
## Release 0.3.0 (2019-07-19T14:06:54)
* Save v0.3.0 notebook in finalized state
* Optimize GIF
* Update README.md
* Add v0.3.0 example notebook
* Sample size is not deterministic
* Fallback to other chart kinds
* [0.3.0-rc0] New minor release candidate
* Make the datatable static after finalization
* Create closure around sample size output
* Change naming schema of the tooltip event
* Optimize width of the chart canvas
* [0.3.0-dev2] New dev release
* Fix incorrect sample size log
* Histogram data point mapping
* Fix histogram not returning a chart
* Get rid of unnecessary console logs
* [0.3.0-dev1] New dev release
* Intercative tooltips on DataTable cell hover
* New graph object: Scatter
* New graph object: Line
* [0.3.0-dev0] New minor release
* Handle datetime index dtype
* Implicitly format date index
* Refactor DataTables configuration
* Pass df index to the chart factory
* Handle dates if used as values the same way as strings
* Fix error message
* New graph object: Histogram
* New graph object: CategoricalBar
* Refactor createDataPreview method to be modular
* Create Bar graph object using chartjs
* Do not use nlargest and nsmallest for Object dtype
* Load chartjs library on initialization
* Bump version
* Update issue templates
* Account for outliers in the sample
* Add issue templates
* Bump version
* Handle focus on search field correctly
* Sort the data before plotting
* Update module level docstrings
* Fix typo in README
* Bump version
* Include setup files in the sdist
* Include css and js files in sdist
* Add banner png and svg images
* Add image of Jupyter toolbar w/ Finalization button
* Bump version
* Re-upload clean jupyter-datatables.png
* Update README with 0.2.0 features and re-run notebook
* Update assets and add new GIFs
* Add notebook demonstrating new features for 0.2.0
* Bump version
* Fix sample size computation
* Bump version
* Include JavaScript content in package data
* Refactor and conform to the StandardJS style
* Optimize the svg-container size for 6 data columns
* Bump version
* Add margins to data previews
* Set fixed size to svg containers
* Implement data preview for time series data
* Get rid of the leftover raw url argument in README
* Add scipy to requirements
* Bump version
* Calculate sample size in a more intelligent way
* Implement data preview for non-numeric dtypes
* Bump version
* Fix boolean mapping
* Map pandas dtypes to DataTables and native JS types
* Register boolean type detector
* Bar plot preview for columns with string dtype
* Refactor previews to work on per-column basis
* Bump version
* Update README.md
* Introduce basic data type inference
* Do not use dots in class names
* Update README.md
* Bump version
* Remove duplicate notebook and update POC notebook
* Histogram preview
* [WIP] Plot histogram preview instead of bar chart
* Bump version
* Move JS code to separate script file
* Require jupyter-require>=0.2.1 for fixed fas icons
* Fix typos in README installation section
* Use raw links to images
* Add MANIFEST.in
* Rename main.css and move it to the python package
* Update README.md
* Require jupyter-require >= 0.2.0
* Setuptools
* Add example of wide table
* Add jupyter-require example image
* Add POC notebook
* Update README.md
* Update README.md
* Add padding to tables to hide scrollbar in Firefox
* Fix non-responsive headers and styling issues
* Add persistent linked scroll event handler
* [WIP] More fine-grained control over data preview generation
* Fix CSS not selector
* Preserve scrolling ability for data preview
* [XL] Refactor the whole datatable generation process
* Fix 2-space indentation and add style for dt-buttons
* Add d3 to required libraries and requirejs config
* [WIP] Preview for each data column
* Customizable alignment of body and header cells
* Fix missing length field and prepend buttons to table
* [WIP] Buttons
* Add .gitignore
* Migrate from jupyter-tools
