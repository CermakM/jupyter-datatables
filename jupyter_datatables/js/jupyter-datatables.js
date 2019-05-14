define('jupyter-datatables', function (require) {
  require('datatables.net')

  let _ = require('underscore')
  let events = require('base/js/events')
  let d3 = require('d3')

  const PLOT_WIDTH = 600

  const PLOT_HEIGHT = 400

  const PLOT_MARGIN = { left: 5, right: 5, top: 10, bottom: 10 }

  let histBinFreedman = function (a) {
    return 2 * (d3.quantile(a, 0.75) - d3.quantile(a, 0.25)) * Math.pow(a.length, -1 / 3)
  }

  let histBinSturges = function (a) {
    return (a[a.length - 1] - a[0]) / (Math.log2(a.length) + 1)
  }

  let histBinAuto = function (a) {
    const binWidthfd = histBinFreedman(a)

    const binWidthSturges = histBinSturges(a)

    return binWidthfd ? Math.min(binWidthfd, binWidthSturges) : binWidthSturges
  }

  let plotHistogram = function (data) {
    data = Array.prototype.map.call(data, Number).sort(d3.ascending)

    const nBins = Math.ceil((data[data.length - 1] - data[0]) / histBinAuto(data))

    let svgContainer = document.createElement('div')
    let svg = d3.select(svgContainer)
      .classed('svg-container', true)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`)
      .classed('svg-content', true)

    let g = svg
      .append('g')
      .classed('bars', true)

    let xScale = d3.scaleLinear()
      .domain(d3.extent(data))
      .nice()
      .range([0, PLOT_WIDTH])

    let bins = d3.histogram()
      .domain(xScale.domain())
      .thresholds(xScale.ticks(nBins))
      (data)

    let yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .nice()
      .range([PLOT_HEIGHT - PLOT_MARGIN.bottom, PLOT_MARGIN.top])

    g.selectAll('.bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.x0) + 1.5)
      .attr('y', (d) => yScale(d.length))
      .attr('width', (d) => Math.max(0, xScale(d.x1) - xScale(d.x0)))
      .attr('height', (d) => yScale(0) - yScale(d.length))
      .attr('fill', 'steelblue')
      .classed('bar', true)

    return svgContainer
  }

  let plotBar = function (x, y) {
    if (_.isUndefined(y)) {
      y = x
      x = [...Array(y.length).keys()]
    }

    const data = d3.zip(x, y)
      .map((v) => _.object(['x', 'y'], v))

    let svgContainer = document.createElement('div')
    let svg = d3.select(svgContainer)
      .classed('svg-container', true)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`)
      .classed('svg-content', true)

    let g = svg
      .append('g')
      .classed('bars', true)

    let xScale = d3.scaleBand()
      .domain(x)
      .range([PLOT_MARGIN.left, PLOT_WIDTH - PLOT_MARGIN.right])
      .padding(0.1)

    let yScale = d3.scaleLinear()
      .domain([0, d3.max(y)])
      .nice()
      .range([PLOT_HEIGHT - PLOT_MARGIN.bottom, PLOT_MARGIN.top])

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.x))
      .attr('y', (d) => yScale(d.y))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => yScale(0) - yScale(d.y))
      .attr('fill', 'steelblue')
      .classed('bar', true)

    return svgContainer
  }

  let plotTimeseries = function (x, y) {
    if (_.isUndefined(y)) {
      y = x
      x = [...Array(y.length).keys()]
    }

    const data = d3.zip(x, y)
      .map((v) => _.object(['x', 'y'], v))

    const radius = 7 // circle radius

    let svgContainer = document.createElement('div')
    let svg = d3.select(svgContainer)
      .classed('svg-container', true)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`)
      .classed('svg-content', true)

    let g = svg
      .append('g')
      .classed('timeseries', true)

    let xScale = d3.scaleTime()
      .domain(d3.extent(data, (d) => d.x))
      .nice()
      .range([PLOT_MARGIN.left, PLOT_WIDTH - PLOT_MARGIN.right])

    let yScale = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.y)])
      .nice()
      .range([PLOT_HEIGHT - PLOT_MARGIN.bottom, PLOT_MARGIN.top])

    let areaPath = d3.area()
      .x((d) => xScale(d.x))
      .y0(PLOT_HEIGHT)
      .y1((d) => yScale(d.y))
      (data)

    let linePath = d3.line()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      (data)

    g.append('path')
      .classed('area', true)
      .attr('d', areaPath)
      .attr('fill', 'lightsteelblue')

    g.append('path')
      .classed('line', true)
      .attr('d', linePath)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 5)

    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', radius)
      .attr('fill', 'steelblue')

    return svgContainer
  }

  const dTypeMap = new Map();
  ['bool'].forEach((dtype) => dTypeMap.set(dtype, 'boolean')); // bool
  ['object', 'string'].forEach(
    (dtype) => dTypeMap.set(dtype, 'string')
  ); // string
  ['int8, int16, int32, int64', 'float8, float16, float32, float64'].forEach(
    (dtype) => dTypeMap.set(dtype, 'num')
  ); // number
  ['datetime8[ns]', 'datetime16[ns]', 'datetime32[ns]', 'datetime64[ns]'].forEach(
    (dtype) => dTypeMap.set(dtype, 'date')
  ) // date

  $.fn.dataTable.Api.register('row.create()', function () {
    let row = $(this.row(0).node())
      .clone()
      .removeClass()

    row
      .children()
      .empty()

    return row
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

  let createDataPreview = function (data, dtype) {
    let dataPreview = null

    data = data.sort()

    const grouped = d3.nest()
      .key((d) => d)
      .rollup((d) => d.length)
      .entries(data)

    switch (dtype) {
      case 'num':
        dataPreview = grouped.length <= 10 ? plotBar(grouped.map((d) => d.value)) : plotHistogram(data)
        break
      case 'boolean':
        // fall-through
      case 'string':
        dataPreview = plotBar(
          grouped.map((d) => d.key),
          grouped.map((d) => d.value)
        )
        break
      case 'date':
        console.log(data)
        dataPreview = plotTimeseries(
          grouped.map((d) => new Date(d.key)),
          grouped.map((d) => d.value)
        )
        break
      default:
        dataPreview = plotHistogram(data)
    }

    return dataPreview
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
              settings.aoColumns[i].sType = dTypeMap.get(dtype) || 'num'
            })

          dTypePreviewRow.ready(() => {
            $(settings.nTHead).append(dTypePreviewRow)
          })

          console.debug('Data preview initialization.', settings)

          let dataPreviewRow = dt.row.create()
            .removeAttr('aria-controls')
            .removeAttr('aria-label')
            .attr('class', 'column-data-preview')

          dataPreviewRow
            .children().each((i, e) => {
              if ($(e).is('th')) return

              $(e)
                .attr('class', 'column-data-preview')
                .attr('role', 'figure')
                .attr('aria-label', `data preview for column ${i}`)

              let dtype = settings.aoColumns[i].sType
              let data = dt.column(i).data().toArray()
              let dataPreview = createDataPreview(data, dtype)

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
