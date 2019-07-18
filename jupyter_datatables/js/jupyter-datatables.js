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

  createDataPreview = function (data, index, dtype) {
    console.debug("Creating data preview.", data, index, dtype)

    const defaults = $.fn.dataTable.defaults

    if (_.isUndefined(dtype))
      console.warn('Data type was not provided')

    else if (!_.has(defaults.dTypePlotMap, dtype))
      throw new Error(`Unknown dtype '${dtype}'`)

    if ( index.length > 1 ) {
        console.warn("Multi-index is not supported yet. Picking the 0th level.")
        // TODO: handle multi-index
    }


    let kind, func, chart;

    for (let k of defaults.dTypePlotMap[dtype]) {
      if (_.has(defaults.graphObjects, k)) {
        kind  = k
        func  = defaults.graphObjects[k]
        chart = func(data, index, dtype)

        if ( chart )
          break
      }
      console.warn("Unknown plot kind: ", k)
    }

    if (_.isUndefined(kind))
      throw new Error(
        `Unable to find graph object for dtype '${dtype}' in: ${defaults.graphObjects}`
      )

    if ( _.isUndefined(chart) || chart === null )
      throw new Error(
        `Unable to produce graph object for dtype '${dtype}'`
      )
    
    const container = $("<div/>", {class: 'dt-chart-container'})
        .append(chart.canvas)
    
    events.on('hideAllTooltips.ChartJS', (e) => {
        hideAllTooltips(chart)
    })

    $(chart.canvas).on('show_tooltip.ChartJS', (e, d) => {
        hideAllTooltips(chart)
        
        // Show tooltip on certain data point
        const dataPoint = d.data
        
        let datasetIndex;
        if ( _.has(chart, 'mapDataPoint') ) {
            datasetIndex = chart.mapDataPoint(dataPoint)
        } else
            datasetIndex = dataPoint.index
        
        showTooltip(chart, datasetIndex)
    })

    return container
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
