define('dt-toolbar', ['dt-components'], function (components) {

  const templates = components.templates

  return class Toolbar {
    constructor(chart, dtype) {
      this.chart = chart
      this.dtype = dtype

      this.settings = components.createElementFromTemplate(templates.DTSettingsComponentTemplate)
      this.settingsButton = components.createElementFromTemplate(templates.DTSettingsButtonComponentTemplate)

      $(this.settingsButton).click(() => {
        if (this.settingsContainer.style.display != 'none') {
          // settings already visible, just toggle
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
            const allowedChartTypes = $.fn.dataTable.defaults.chartMap[this.dtype]

            $(this.settings).find('.dt-chart-type').each((i, e) => {
              const chartName = e.dataset.chart_name

              // check active chart type
              $(e).toggleClass('is-active', chartName === chart.name)

              // check which chart types are not allowed for the current dtype and disable them
              if (!allowedChartTypes.includes(chartName)) {
                $(e).addClass('is-disabled')
                console.debug(`Chart type '${chartName}' is not allowed for dtype '${dtype}'`)
              } else {
                // in case dtype changes for some reason
                $(e).removeClass('is-disabled')
              }
            })
          }

          // click anywhere else hides the settings
          setTimeout(() => {
            $(document).one('click', () => $(this.settingsContainer).hide())
          }, 20)
        }
      })

      this.settingsContainer = document.createElement('div', { is: 'dt-container' })
      this.settingsContainer.classList.add('dt-chart-settings-container')

      $(this.settingsContainer).append(this.settings)
      $(this.settingsContainer).css({ position: 'absolute' })
      $(this.settingsContainer).hide()

      // Append to the output area to allow overlay
      const output_area = Jupyter.notebook.get_executed_cell().output_area
      $(output_area.element).append(this.settingsContainer)

      this.container = document.createElement('div', { is: 'dt-container' })
      this.container.classList.add('dt-chart-toolbar')

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
      if (container) { this.container.remove() } else { $(this.container).empty() } // remove all children but leave the container
    }

    onClick(callback, selector) {
      let selection = $(this.settings).find(selector)

      if (selection.length <= 0) { throw new Error(`Selector '${selector}' dit not match any elements.`) }

      selection.each((i, elt) => {
        $(elt).click(e => {
          e.preventDefault()

          callback.call(elt, e, this.chart)
        })
      })
    }
  }

})
