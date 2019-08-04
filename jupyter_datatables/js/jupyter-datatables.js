define('jupyter-datatables', [
  'underscore',
  'moment',
  'dt-config',
  'dt-components',
  'dt-graph-objects',
  'dt-toolbar',
  'dt-tooltips',
], function (_, moment, config, components, go, Toolbar, tooltips) {
  require('datatables.net')

  const d3 = require('d3')
  const events = require('base/js/events')

  config.graphObjects = Object(go)

  $.fn.dataTable.Api.register('row.create()', function () {
    let row = $(this.row(0).node())
      .clone()
      .removeClass()

    row
      .children()
      .empty()

    return row
  })

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

  let createDataToolbar = function (chart, data, index, dtype) {
    const toolbar = new Toolbar(chart, dtype)

    setTimeout(() => {
      toolbar.onClick(function (event, chart) {
        if ($(event.target).hasClass('is-active')) {
          event.preventDefault() // do not propagate

          console.debug(`Chart '${chart.name}' is already set. Skipping chart update.`)
          return
        }

        console.debug('Updating chart:', chart)

        const go = this.dataset.chart_name

        chart.toolbar.empty()
        chart.destroy()

        chart.container.replaceWith(createDataPreview(data, index, dtype, go))
      }, 'a.dt-chart-type')
    }, 100)

    return toolbar
  }

  let createDataPreview = function (data, index, dtype, go) {
    console.debug('Creating data preview.', data, index, dtype)

    if (_.isUndefined(dtype)) { console.warn('Data type was not provided.') } else if (!_.has(config.chartMap, dtype)) { throw new Error(`Unknown dtype '${dtype}'.`) }

    if (index.length > 1) {
      console.warn('Multi-index is not supported yet. Picking the 0th level.')
      // TODO: handle multi-index
    }

    let kind, GraphObject, chart

    if (_.isUndefined(go)) {
      console.warn('Graph object was not provided.')

      for (let k of config.chartMap[dtype]) {
        if (_.has(config.graphObjects, k)) {
          kind = k
          GraphObject = config.graphObjects[k]

          chart = new GraphObject(data, index, dtype)
          if (chart) { break }
        }
        console.warn('Unknown plot kind: ', k)
      }

      if (_.isUndefined(kind)) {
        throw new Error(
          `Unable to find graph object for dtype '${dtype}' in: ${config.graphObjects}`
        )
      }
    } else {
      GraphObject = _.isString(go) ? config.graphObjects[go] : go
      chart = new GraphObject(data, index, dtype)
    }

    // set chart name for future reference
    chart.name = GraphObject.name

    if (_.isUndefined(chart) || chart === null) {
      throw new Error(
        `Unable to produce graph object for dtype '${dtype}'`
      )
    }

    registerChartEvents(chart)

    console.debug('Data preview has been created: ', chart)

    chart.toolbar = createDataToolbar(chart, data, index, dtype)
    chart.container = $('<div/>', { class: 'dt-chart-container' })
      .append(chart.toolbar.container)
      .append(chart.canvas)

    return chart.container
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
              settings.aoColumns[i].sType = config.dTypeMap[dtype]
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
                index.push({ data: data, dtype: dtype, level: i })
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

          registerDataTableEvents(dt)

          resolve(settings)
        }
      })

      let dt = $(table).DataTable(options).columns.adjust()
        .responsive.recalc()
        .columns.adjust()
      let btns = new $.fn.dataTable.Buttons(dt, {
        buttons: buttons
      })

      events.one('output_appended.OutputArea', () => {
        setTimeout(dt.columns.adjust, 50)
      })

      $(dt.table().container()).prepend(btns.container())
    })
  }

  let registerChartEvents = function (chart) {
    events.on('hide_all_tooltips.ChartJS', () => {
      tooltips.hideAllTooltips(chart)
    })

    $(chart.canvas).on('show_tooltip.ChartJS', (e, d) => {
      tooltips.hideAllTooltips(chart)

      // Show tooltip on certain data point
      const dataPoint = d.data

      let datasetIndex
      if (_.has(chart, 'mapDataPoint')) {
        datasetIndex = chart.mapDataPoint(dataPoint)
      } else { datasetIndex = chart.data.labels.indexOf(dataPoint.index) }

      tooltips.showTooltip(chart, datasetIndex)
    })
  }

  let registerDataTableEvents = function (dt) {

    dt.on('mouseleave', 'tbody', function (e) {
      events.trigger('hide_all_tooltips.ChartJS')
    })

    dt.on('mouseenter', 'td', function (e) {
      let cell = dt.cell(this)
      let idx = cell.index()

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

      console.log('Finalizing canvas elements...', canvasElements)
      canvasElements.each((i, canvas) => {
        const dataURL = canvas.toDataURL('image/png')
        const canvasPNG = $('<img/>', { src: dataURL, class: 'dt-chart-image' }).get(0)

        console.debug('\tResulting image: ', canvasPNG)

        canvas.replaceWith(canvasPNG)
      })

      console.debug('\tDisabling buttons and search fields...')

      $('a.paginate_button, .dt-button, input[type=search], .dataTables_length select')
        .off('click')
        .css('cursor', 'not-allowed')
        .css('color', '#999')
        .addClass('disabled')
        .prop('disabled', true)

      console.log('Canvas finalization completed successfully.')
    })

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

        $(this).blur() // focus out of the search element

        oArea.keyboard_manager.enable()

        return events.trigger('select.Cell', { 'cell': cell })
      }

      return true
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
	   * Create DataTable from raw string and append it to an element
	   */
  return appendDataTable = async function (html, options, buttons, element) {
    const table = await appendTable(html, element)

    return createDataTable(table, options, buttons)
  }
})
