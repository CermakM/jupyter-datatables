/**
 * Jupyter DataTables
 *
 * @module
 * @summary     Jupyter DataTables
 * @description Jupyter interactive pandas DataFrame representation leveraging pandas, DataTables and ChartJS.
 * @file        components.js
 * @author      Marek Cermak
 * @contact     macermak@redhat.com
 * @copyright   Copyright 2019 Marek Cermak <macermak@redhat.com>
 *
 * This source file is free software, available under the following license:
 *   MIT license
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: https://github.com/CermakM/jupyter-datatables
 */

define('dt-components', ['underscore'], function (_) {

  _.templateSettings = {
    escape: /\{\{%-([\s\S]+?)%\}\}/g,
    evaluate: /\{\{%([\s\S]+?)%\}\}/g,
    interpolate: /\{\{(.+?)\}\}/g
  }


  class DTContainer extends HTMLDivElement {
    constructor() {
      super()

      this.attachShadow({ mode: 'open' })

      // Bulma CSS
      const bulmaStyle = document.createElement('style')
      bulmaStyle.textContent = '@import url(https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.5/css/bulma.min.css);'

      this.shadowRoot.appendChild(bulmaStyle)

      // Jupyter DataTables CSS
      $(this.shadowRoot).append($('style#jupyter-datatables-css').clone())

      // classes
      this.classList.add('dt-container')
    }

    connectedCallback() {
      // FontAwesome icons
      const fas = document.querySelector('link[href*="fontawesome"]')

      if (fas) {
        this.shadowRoot.appendChild(fas.cloneNode())
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
        const li = document.createElement('li')
        const a = document.createElement('a')

        a.setAttribute('role', 'button')
        a.setAttribute('aria-disabled', false)
        a.setAttribute('aria-pressed', false)

        a.setAttribute('data-chart_name', chartName)
        a.setAttribute('data-label', 'button-chart-type')

        a.style = 'text-transform: capitalize'
        a.textContent = `${chartName} chart`

        a.classList.add('dt-button')
        a.classList.add('dt-chart-type')

        li.appendChild(a)

        this.appendChild(li)
      }

      this.classList.add('menu-list')
      this.classList.add('dt-chart-list')
    }
  }

  customElements.define('dt-container', DTContainer, { extends: 'div' })
  customElements.define('dt-chart-list', DTChartList, { extends: 'ul' })


  /* Templates */

  const DTSettingsButtonComponentTemplate = _.template(`
    <div class="button is-small dt-chart-settings-button">
        <figure class="bd-link-figure">
            <span class="icon">
                <i class="fas fa-ellipsis-v"></i>
            </span>

        </figure>
    </div>
  `)

  const DTSettingsComponentTemplate = _.template(`
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

  let createElementFromTemplate = function (template, context) {
    let tmp = document.implementation.createHTMLDocument()
    tmp.body.innerHTML = template(context)

    return tmp.body.children[0]
  }


  return {
    createElementFromTemplate: createElementFromTemplate,

    DTChartList: DTChartList,
    DTContainer: DTContainer,

    templates: {
      DTSettingsButtonComponentTemplate: DTSettingsButtonComponentTemplate,
      DTSettingsComponentTemplate: DTSettingsComponentTemplate,
    }
  }
})
