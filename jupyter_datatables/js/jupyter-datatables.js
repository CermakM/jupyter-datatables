define('jupyter-datatables', ["moment", "graph-objects"], function (moment, go) {
  require('datatables.net')

  const _      = require('underscore')
  const d3     = require('d3')
  const events = require('base/js/events')

  $.fn.dataTable.defaults.dateDisplayFormat = "YYYYMMDD"
  $.fn.dataTable.defaults.formatDate = (t, format) => moment(t, format || $.fn.dataTable.defaults.dateDisplayFormat)

  $.fn.dataTable.Api.register('row.create()', function () {
    let row = $(this.row(0).node())
      .clone()
      .removeClass()

    row
      .children()
      .empty()

    return row
  })


  let mapDType = (dtypes, target) => _.object(_.zip(dtypes, new Array(dtypes.length).fill(target)))

  $.fn.dataTable.defaults.graphObjects = Object(go)
  $.fn.dataTable.defaults.dTypeMap = {
    ...mapDType(['int8', 'int16', 'int32', 'int64', 'float8', 'float16', 'float32', 'float64'], "num"),
    ...mapDType(['datetime8[ns]', 'datetime16[ns]', 'datetime32[ns]', 'datetime64[ns]'], "date"),
    ...mapDType(['timedelta8[ns]', 'timedelta16[ns]', 'timedelta32[ns]', 'timedelta64[ns]'], "string"), // TODO: Custom type `timedelta`
    ...mapDType(["object", "string"], "string"),
    ...mapDType(["bool"], "boolean"),
    ...mapDType(["default"], "num")
  }

  $.fn.dataTable.defaults.dTypePlotMap = {
    boolean:  ['CategoricalBar', 'Histogram'],
    date:     ['CategoricalBar', 'Histogram'],
    num:      ['Histogram', 'CategoricalBar', 'Bar', 'Line'],
    string:   ['CategoricalBar', 'Histogram'],

    undefined: ['Bar']
  }

  $.fn.dataTable.defaults.chartIconMap = {
    bar    : 'chart-bar',
    line   : 'chart-line',
    scatter: 'palette',
    pie    : 'chart-pie',
    
    default: 'chart-bar'
  } 

  /**
   * Boolean type detector
   */
  $.fn.dataTable.ext.type.detect.unshift(function (data) {
    const dtype = 'boolean'

    if (_.isBoolean(data)) {
      return dtype
    } else if (_.isString(data)) {
      return (/true|false/i).test(data.toLowerCase()) ? dtype : null
    }

    return null
  })

  /* Components */

  class DTContainer extends HTMLDivElement {
    constructor() {
      super()

      this.attachShadow({ mode: 'open' })

      // Bulma CSS
      const bulmaStyle = document.createElement('style')
      bulmaStyle.textContent = `@import url(https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.5/css/bulma.min.css);`

      this.shadowRoot.appendChild(bulmaStyle)

      // Jupyter DataTables CSS
      $(this.shadowRoot).append($('style#jupyter-datatables-css').clone())

      // classes
      this.classList.add("dt-container")
    }

    connectedCallback() {
      // FontAwesome icons
      const fas = document.querySelector('link[href*="fontawesome"]');

      if (fas) {
        this.shadowRoot.appendChild(fas.cloneNode());
      }
    }

    append(e) {
      this.shadowRoot.append(e)
    }

    appendChild(node) {
      this.shadowRoot.appendChild(node)
    }
  }


  class DTChartList extends HTMLUListElement {

    constructor() {
      super()

      for (const chartName in $.fn.dataTable.defaults.graphObjects) {
        const li = document.createElement("li")
        const a = document.createElement("a")

        a.setAttribute("role", "button")
        a.setAttribute("aria-disabled", false)
        a.setAttribute("aria-pressed", false)

        a.setAttribute("data-chart_name", chartName)
        a.setAttribute("data-label", 'button-chart-type')

        a.style = "text-transform: capitalize"
        a.textContent = `${chartName} chart`

        a.classList.add("dt-button")
        a.classList.add("dt-chart-type")

        li.appendChild(a)

        this.appendChild(li)
      }

      this.classList.add("menu-list")
      this.classList.add("dt-chart-list")
    }
  }

  customElements.define('dt-container', DTContainer, { extends: 'div' })
  customElements.define('dt-chart-list', DTChartList, { extends: 'ul' })

  /* Templates */

  _.templateSettings = {
    escape: /\{\{%-([\s\S]+?)%\}\}/g,
    evaluate: /\{\{%([\s\S]+?)%\}\}/g,
    interpolate: /\{\{(.+?)\}\}/g,
  };

  DTSettingsButtonComponentTemplate = _.template(`
    <div class="button is-small dt-chart-settings-button">
        <figure class="bd-link-figure">
            <span class="icon">
                <i class="fas fa-ellipsis-v"></i>
            </span>

        </figure>
    </div>
  `)

  DTSettingsComponentTemplate = _.template(`
    <div class="menu dt-chart-settings">
        <p class="menu-label dt-chart-menu-label">Charts</p>
        <ul class="menu-list">
            <li>
                <a>Kind</a>
                <ul is="dt-chart-list"></ul>
            </li>
        </ul>
    </div>
  `)

  createElementFromTemplate = function (template, context) {
    tmp = document.implementation.createHTMLDocument()
    tmp.body.innerHTML = template(context)

    return tmp.body.children[0]
  }

  /* Toolbar */

  Toolbar = class {
    constructor(chart, dtype) {
      this.chart = chart
      this.dtype = dtype

      this.settings = createElementFromTemplate(DTSettingsComponentTemplate)
      this.settingsButton = createElementFromTemplate(DTSettingsButtonComponentTemplate)

      $(this.settingsButton).click((e) => {
        if (this.settingsContainer.style.display != 'none') {
          // this.settings already visible, just toggle
          $(this.settingsContainer).hide()
        } else {
          const offset = {}
          const margin = { top: 20, left: 0 }

          offset.top = $(this.settingsButton).offset().top - $(output_area.element).offset().top
          offset.top = offset.top + margin.top

          offset.left = $(this.settingsButton).offset().left - $(output_area.element).offset().left
          offset.left = offset.left + margin.left

          $(this.settingsContainer).css(offset).show()

          if (!_.isUndefined(this.dtype)) {
            const allowedChartTypes = $.fn.dataTable.defaults.dTypePlotMap[this.dtype]

            $(this.settings).find('.dt-chart-type').each((i, e) => {
              const chartName = e.dataset.chart_name

              // check active chart type
              $(e).toggleClass('is-active', chartName === chart.name)

              // check which chart types are not allowed for the current dtype and disable them
              if (!allowedChartTypes.includes(chartName)) {
                $(e).addClass('is-disabled')
                console.debug(`Chart type '${chartName}' is not allowed for dtype '${dtype}'`)
              } else {
                $(e).removeClass('is-disabled')
              }
            })
          }

          // click anywhere else hides the this.settings
          setTimeout(() => {
            $(document).one('click', () => $(this.settingsContainer).hide())
          }, 20)
        }
      })

      this.settingsContainer = document.createElement('div', { is: 'dt-container' })
      this.settingsContainer.classList.add('dt-chart-settings-container')

      $(this.settingsContainer).append(this.settings)
      $(this.settingsContainer).css({ position: 'absolute' });
      $(this.settingsContainer).hide()

      // Append to the output area to allow overlay
      const output_area = Jupyter.notebook.get_executed_cell().output_area
      $(output_area.element).append(this.settingsContainer)

      this.container = document.createElement('div', { is: 'dt-container' })
      this.container.classList.add("dt-chart-toolbar")

      $(this.container).append(this.settingsButton)
    }
        
    empty() {
        this.destroy(false)
    }
    
    destroy(container = true) {
        this.settings.remove()
        this.settingsButton.remove()
        this.settingsContainer.remove()
        
        // finally remove the toolbar container itself if `container` is specified
        if ( container )
          this.container.remove()
        else
          $(this.container).empty()  // remove all children but leave the container
    }

    onClick(callback, selector) {
      let selection = $(this.settings).find(selector)

      if (selection.length <= 0)
        throw new Error(`Selector '${selector}' dit not match any elements.`)

      selection.each((i, elt) => {
        $(elt).click(e => {
          e.preventDefault()

          callback.call(elt, e, this.chart)
        })
      })
    }
  }

  createDataToolbar = function (chart, data, index, dtype) {
    const toolbar = new Toolbar(chart, dtype)

    setTimeout(() => {
      toolbar.onClick(function (event, chart) {
        if ( $(event.target).hasClass('is-active') ) {
          event.preventDefault()  // do not propagate

          console.debug(`Chart '${chart.name}' is already set. Skipping chart update.`)
          return
        }

        console.debug('Updating chart:', chart)

        const go = this.dataset.chart_name

        chart.toolbar.empty()
        chart.destroy()

        chart.container.replaceWith( createDataPreview(data, index, dtype, go) )
      }, "a.dt-chart-type")
    }, 100)

    return toolbar
  }

  /* Data Preview */

  let createDTypePreview = function (dtype) {
    const dTypeContainer = $('<div>')
      .attr('class', 'dtype-container')

    // dtype element
    const dTypeSelect = $('<select>')
      .attr('role', 'option')
      .attr('class', 'dtype')
      .appendTo(dTypeContainer)

    const dTypeOptions = [
      $('<option>').attr('value', dtype).text(dtype)
      // TODO: other options suitable for this column
    ]

    dTypeOptions.forEach((opt) => opt.appendTo(dTypeSelect))

    return dTypeContainer
  }

  createDataPreview = function (data, index, dtype, go) {
    console.debug("Creating data preview.", data, index, dtype)

    const defaults = $.fn.dataTable.defaults

    if (_.isUndefined(dtype))
      console.warn('Data type was not provided.')

    else if (!_.has(defaults.dTypePlotMap, dtype))
      throw new Error(`Unknown dtype '${dtype}'.`)

    if (index.length > 1) {
      console.warn("Multi-index is not supported yet. Picking the 0th level.")
      // TODO: handle multi-index
    }

    //   let kind, plot, chart;
    let kind, GraphObject;

    if (_.isUndefined(go)) {
      console.warn('Graph object was not provided.')

      for (let k of defaults.dTypePlotMap[dtype]) {
        if (_.has(defaults.graphObjects, k)) {
          kind = k
          GraphObject = defaults.graphObjects[k]

          chart = GraphObject(data, index, dtype)
          if (chart)
            break
        }
        console.warn("Unknown plot kind: ", k)
      }

      if (_.isUndefined(kind))
        throw new Error(
          `Unable to find graph object for dtype '${dtype}' in: ${defaults.graphObjects}`
        )
    } else {
      GraphObject = _.isString(go) ? defaults.graphObjects[go] : go
      chart = new GraphObject(data, index, dtype)
    }

    // set chart name for future reference
    chart.name = GraphObject.name

    if (_.isUndefined(chart) || chart === null)
      throw new Error(
        `Unable to produce graph object for dtype '${dtype}'`
      )

    register_chart_events(chart)

    console.debug("Data preview has been created: ", chart)

    chart.toolbar = createDataToolbar(chart, data, index, dtype)
    chart.container = $("<div/>", { class: 'dt-chart-container' })
      .append(chart.toolbar.container)
      .append(chart.canvas)

    return chart.container
  }

  let showTooltip = function(chart, pointIndex, datasetIndex = 0) {
    if( _.isUndefined(chart.tooltip._active) )
      chart.tooltip._active = []

    let activeElements = chart.tooltip._active
    let requestedElement = chart.getDatasetMeta(datasetIndex).data[pointIndex]

    for(var i = 0; i < activeElements.length; i++) {
       if(requestedElement._index == activeElements[i]._index)  
          return
    }

    activeElements.push(requestedElement)
    
    chart.tooltip._active = activeElements
    chart.tooltip.update(true)
    chart.tooltip.pivot()
    chart.draw()
  }

  let hideTooltip = function (chart, pointIndex, datasetIndex = 0) {
    let activeElements = chart.tooltip._active
    if (_.isUndefined(activeElements) || activeElements.length == 0)
      return

    let requestedElement = chart.getDatasetMeta(datasetIndex).data[pointIndex]
    for (var i = 0; i < activeElements.length; i++) {
      if (requestedElement._index == activeElements[i]._index) {
        activeElements.splice(i, 1)
        break
      }
    }

    chart.tooltip._active = activeElements
    chart.tooltip.update(true)
    chart.draw()
  }


  let hideAllTooltips = function (chart) {
    let activeElements = chart.tooltip._active
    if (_.isUndefined(activeElements) || activeElements.length == 0)
      return

    activeElements = []

    chart.tooltip._active = activeElements
    chart.tooltip.update(true)
    chart.draw()
  }


  let register_chart_events = function (chart) {
    events.on('hideAllTooltips.ChartJS', (e) => {
      hideAllTooltips(chart)
    })

    $(chart.canvas).on('show_tooltip.ChartJS', (e, d) => {
      hideAllTooltips(chart)

      // Show tooltip on certain data point
      const dataPoint = d.data

      let datasetIndex;
      if (_.has(chart, 'mapDataPoint')) {
        datasetIndex = chart.mapDataPoint(dataPoint)
      } else
        datasetIndex = chart.data.labels.indexOf(dataPoint.index)

      showTooltip(chart, datasetIndex)
    })
  }

  let createDataTable = function (table, options, buttons) {
    return new Promise((resolve) => {
      Object.assign(options, {
        fnInitComplete: function (settings) {
          let dt = settings.oInstance.api()

          console.debug('dtype preview initialization.', settings)

          let dTypePreviewRow = dt.row.create()
            .removeAttr('aria-label')
            .attr('class', 'dtype-preview')

          dTypePreviewRow
            .children().each((i, e) => {
              if ($(e).is('th')) { return }

              let dtype = settings.aoColumns[i].sType
              let dTypePreview = createDTypePreview(dtype)

              $(e)
                .attr('class', 'column-dtype-preview dt-head-center')
                .attr('aria-label', `dtype preview for column ${i}`)
                .append(dTypePreview)

              // map dtype back to known format
              // TODO: run type detectors instead of assuming 'num'
              settings.aoColumns[i].sType = $.fn.dataTable.defaults.dTypeMap[dtype]
            })

          dTypePreviewRow.ready(() => {
            $(settings.nTHead).append(dTypePreviewRow)
          })

          console.debug('Data preview initialization.', settings)

          let dataPreviewRow = dt.row.create()
            .removeAttr('aria-controls')
            .removeAttr('aria-label')
            .attr('class', 'column-data-preview')

          let index = []

          dataPreviewRow
            .children().each((i, e) => {
              let dtype = settings.aoColumns[i].sType
              let data = dt.column(i).data().toArray()

              if ($(e).is('th')) {
                index.push({data: data, dtype: dtype, level: i})
                return
              }

              $(e)
                .attr('class', 'column-data-preview')
                .attr('role', 'figure')
                .attr('aria-label', `data preview for column ${i}`)

              let dataPreview = createDataPreview(data, index, dtype)

              $(e).append(dataPreview)
            })

          dataPreviewRow.ready(() => {
            $(settings.nTHead).append(dataPreviewRow)
          })

          // if there is a search bar, disable the keyboard manager on focus

          resolve(settings)
        }
      })

      let dt = $(table).DataTable(options).columns.adjust()
        .responsive.recalc()
        .columns.adjust()
      let btns = new $.fn.dataTable.Buttons(dt, {
        buttons: buttons
      })

      dt.on('mouseleave', 'tbody', function(e) {
        events.trigger('hideAllTooltips.ChartJS')
      })

      dt.on('mouseenter', 'td', function (e) {
        let cell = dt.cell(this)
        let idx  = cell.index()

        const dIndex = dt.row(idx.row).data()[0]
        const dValue = dt.row(idx.row).data()[idx.column]

        const canvas = $(dt.table().container())
          .find('canvas')
          .get(idx.column - 1)

        $(canvas).trigger('show_tooltip.ChartJS', {
          cell: cell,
          data: {
            index: dIndex,
            value: dValue
          }
        })
      })

      events.on('before_finalize.JupyterRequire', function () {
        const canvasElements = $('canvas')

        console.log("Finalizing canvas elements...", canvasElements)
        canvasElements.each((i, canvas) => {
          const parent = canvas.parentNode
          const dataURL = canvas.toDataURL('image/png')

          const canvasPNG = $("<img/>", { src: dataURL, class: "dt-chart-image" }).get(0)

          console.debug("\tResulting image: ", canvasPNG)

          canvas.replaceWith(canvasPNG)
        })

        console.debug("\tDisabling buttons and search fields...")

        $('a.paginate_button, .dt-button, input[type=search], .dataTables_length select')
          .off('click')
          .css('cursor', 'not-allowed')
          .css('color', '#999')
          .addClass('disabled')
          .prop('disabled', true)

        console.log("Canvas finalization completed successfully.")
      })

      events.one('output_appended.OutputArea', () => {
        setTimeout(dt.columns.adjust, 50)
      })

      $(dt.table().container()).prepend(btns.container())
    })
  }

  /**
     * Create HTML table from raw String and append it to an element
     *
     * @param {String} html
     * @param {Element} element
     */
  let appendTable = function (html, element) {
    return new Promise((resolve) => {
      const table = $.parseHTML(html)

      $(table).ready(() => {
        element.append(table)
        resolve(table)
      })
    })
  }

  /**
   * Initialize events
   */
  let initDataTableEvents = function () {
    // Focus search field event
    $(document).on('focus', '.dataTables_filter input', function (e) {
      setTimeout(() => {
        let cell = Jupyter.notebook.get_selected_cell()
        let oArea = cell.output_area

        if (e.type === 'focusin') {
          oArea.keyboard_manager.disable()
        } else { oArea.keyboard_manager.enable() }
      }, 50) // set timeout to let Jupyter select the cell
    })

    // Keyup search field event
    $(document).on('keyup', '.dataTables_filter input', function (e) {
      if ($(this).is(':focus') && e.key === 'Escape') {
        let cell = Jupyter.notebook.get_selected_cell()
        let oArea = cell.output_area

        $(this).blur()  // focus out of the search element

        oArea.keyboard_manager.enable()

        return events.trigger('select.Cell', { 'cell': cell })
      }

      return true
    })
  }

  /**
     * Create DataTable from raw string and append it to an element
     */
  return appendDataTable = async function (html, options, buttons, element) {
    const table = await appendTable(html, element)

    initDataTableEvents()

    return createDataTable(table, options, buttons)
  }
})
