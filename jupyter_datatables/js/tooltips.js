define('dt-tooltips', ['underscore'], function (_) {

  let showTooltip = function (chart, pointIndex, datasetIndex = 0) {
    if (chart.animating) return // chart is still in animation process

    if (_.isUndefined(chart.tooltip._active)) { chart.tooltip._active = [] }

    let activeElements = chart.tooltip._active
    let requestedElement = chart.getDatasetMeta(datasetIndex).data[pointIndex]

    for (var i = 0; i < activeElements.length; i++) {
      if (requestedElement._index == activeElements[i]._index) { return }
    }

    activeElements.push(requestedElement)

    chart.tooltip._active = activeElements
    chart.tooltip.update(true)
    chart.tooltip.pivot()
    chart.draw()
  }

  let hideTooltip = function (chart, pointIndex, datasetIndex = 0) {
    let activeElements = chart.tooltip._active
    if (_.isUndefined(activeElements) || activeElements.length == 0) { return }

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
    if (_.isUndefined(activeElements) || activeElements.length == 0) { return }

    activeElements = []

    chart.tooltip._active = activeElements
    chart.tooltip.update(true)
    chart.draw()
  }

  return {
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,

    hideAllTooltips: hideAllTooltips
  }
})
