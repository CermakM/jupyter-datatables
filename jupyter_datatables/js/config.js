define('dt-config', ['underscore', 'moment'], function (_, moment) {

  let mapDType = (dtypes, target) => _.object(_.zip(dtypes, new Array(dtypes.length).fill(target)))

  $.fn.dataTable.defaults.dateDisplayFormat = 'YYYYMMDD'
  $.fn.dataTable.defaults.formatDate = (t, format) => moment(t, format || $.fn.dataTable.defaults.dateDisplayFormat)

  $.fn.dataTable.defaults.dTypeMap = {
    ...mapDType(['int8', 'int16', 'int32', 'int64', 'float8', 'float16', 'float32', 'float64'], 'num'),
    ...mapDType(['datetime8[ns]', 'datetime16[ns]', 'datetime32[ns]', 'datetime64[ns]'], 'date'),
    ...mapDType(['timedelta8[ns]', 'timedelta16[ns]', 'timedelta32[ns]', 'timedelta64[ns]'], 'string'), // TODO: Custom type `timedelta`
    ...mapDType(['object', 'string'], 'string'),
    ...mapDType(['bool'], 'boolean'),
    ...mapDType(['default'], 'num')
  }

  $.fn.dataTable.defaults.chartMap = {
    boolean: ['CategoricalBar', 'Histogram'],
    date: ['CategoricalBar', 'Histogram'],
    num: ['Histogram', 'CategoricalBar', 'Bar', 'Line'],
    string: ['CategoricalBar'],

    undefined: ['Bar']
  }

  return $.fn.dataTable.defaults
})
