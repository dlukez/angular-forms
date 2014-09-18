'use strict';

/**
 * Build a context for executing expressions in the form schema.
 */
function buildContext($scope) {
  // create a hash of fields from the array
  var context;
  
  function getParentContext() {
    return $scope.$parent && angular.isFunction($scope.$parent.getContext) && $scope.$parent.getContext();
  }

  $scope.$watchCollection('form.fields', function (fields) {
    context = {};
    angular.forEach(fields, function (field) {
      context[field.name] = field;
    });
    context.$parent = getParentContext();
  });

  $scope.getContext = function () {
    return context;
  };
}

///////////////////////////
// controllers
//

var FormController = ['$scope', function ($scope) {
  this.getRoot = function () {
    return $scope.form;
  };

  buildContext($scope);
}];

////////////////////////
// main module
// 

var formsModule = angular.module('dz.forms', ['dz.forms.templates', 'dz.forms.fields']);

formsModule.provider('dzForm', function () {
  this.$get = function () {
    var fields = {};
    return {
      registerField: function (name, field) {
        fields[name] = field;
      },
      unregisterField: function (name) {
        delete fields[name];
      },
      getFields: function () {
        // return a shallow copy
        // so that changing the original object won't change our internal map
        // but we allow things to change the field definitions themselves
        return angular.extend({}, fields);
      },
      getField: function (name) {
        if(!fields[name]) return null;
        return fields[name];
      }
    };
  };
});

formsModule.directive('dzForm', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      disabled: '&',
      model: '='
    },
    replace: true,
    templateUrl: 'form.tpl.html',
    controller: FormController,
    link: function ($scope, $element, $attrs) {
      // validate attributes
      if(!$attrs.model) throw new Error("Please supply a 'model' to bind to.");

      // disable all fields by wrapping them all in a fieldset
      var $fieldset = angular.element($element.find('fieldset'));
      $scope.$watch('disabled()', function (disabled) {
        $fieldset.prop('disabled', disabled);
      });
    }
  };
});

formsModule.directive('dzField', ['$interpolate', '$parse', function ($interpolate, $parse) {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    require: '^dzForm',
    templateUrl: 'field.tpl.html',
    link: function ($scope, $element, $attrs, formController) {
      // set up context/locals to be used in expressions
      var locals = { this: $scope.field };
      function getContext() {
        var context = $scope.getContext();
        context.$form = $scope.form;
        context.$root = formController.getRoot();
        return context;
      }

      // setup properties that can contain expressions.
      // we define them using an object hash that specifies their default value.
      var expressionProperties = { 'visible': true, 'required': false, 'disabled': false };
      angular.forEach(expressionProperties, function (def, prop) {
        $scope.$watch(function () {
          return $scope.field[prop];
        }, function () {
          var exp = $scope.field[prop] && $parse($scope.field[prop]);
          $scope[prop] = makeExpressionPropertyFunction(exp, def);
        });
      });

      // create a closure that returns either the result
      // of an expression or a default value
      function makeExpressionPropertyFunction(exp, def) {
        return function () {
          return exp ? exp(getContext(), locals) : def;
        };
      }

      // standardise the field's options
      // into a consistent array format.
      function standardiseOptions() {
        var options = $scope.field.options;
        if(!options) return;

        // array is an object, so array must come first
        if(angular.isArray(options)) {
          var standardised = [];

          // allow processing a list of strings
          angular.forEach(options, function (option) {
            if(typeof option === 'string') {
              standardised.push({ value: option, label: option });
            } else {
              standardised.push(option);
            }
          });

          $scope.options = standardised;
        }

        // turn an object into an array (which is what the field renderers expect)
        else if(angular.isObject(options)) {
          var array = [];
          angular.forEach(options, function (label, value) {
            array.push({ value: value, label: label });
          });
          $scope.options = array;
        }

        // probably shouldn't get here
        else {
          $scope.options = null;
        }
      }
      standardiseOptions();
      $scope.$watch('field.options', standardiseOptions);

      // interpolate the value property
      if($scope.field.value) {
        var valueExp = $interpolate($scope.field.value, true);
        if(!valueExp) return;
        $scope.$watch(function valueWatchFn() {
          return valueExp(getContext(), locals);
        }, function valueWatchActionFn(value) {
          $scope.field.value = value;
        });
      }
    }
  };
}]);

formsModule.directive('dzFieldInsertInput', ['$http', '$compile', '$templateCache', 'dzForm', function ($http, $compile, $templateCache, dzForm) {
  return {
    restrict: 'M',
    link: function ($scope, $element) {
      var last;
      function loadField() {
        var type = $scope.field.type,
            field;

        // clean the last object
        if(last) {
          last.remove();
          last = null;
        }

        // if no type, don't try and load it
        if(!type) return;

        field = dzForm.getField(type);
        // if the field doesn't exist, give up
        if(!field) return;

        // load the field template
        if(field.templateUrl) {
          $http.get(field.templateUrl, {cache: $templateCache}).success(create);
        } else if(field.template) {
          create(field.template);
        }
        
        function create(html) {
          var el = angular.element(html);

          // apply properties to the loaded template
          for(var property in $scope.field.properties) {
            el.prop(property, $scope.field.properties[property]);
          }

          $compile(el)($scope);
          $element.after(el);

          // keep track of the last use so we can clean it up if the type of the field changes
          last = el;
        }
      }

      // load when the field type changes
      $scope.$watch('field.type', function (n, o) {
        if(n !== o) loadField();
      });

      // load if the registered field changes
      $scope.$watch(function () { return dzForm.getField($scope.field && $scope.field.type); }, loadField, true);
    }
  };
}]);

formsModule.directive('dzSubForm', function () {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    templateUrl: 'form.tpl.html',
    link: function ($scope, $element, $attrs) {
      // shadow form and model
      $scope.form = $scope[$attrs.form];
      $scope.model = $scope.model && $scope.model[$scope.field.name];
      buildContext($scope);
    }
  };
});

/////////////////////
// basic fields
//

var fieldsModule = angular.module('dz.forms.fields', ['dz.forms.fields.templates']);

fieldsModule.run(['dzForm', function (dzForm) {
  var fields = ['checkbox', 'date', 'form', 'hidden', 'number', 'radio', 'select', 'text', 'textarea'];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var templateUrl = 'fields/' + field + '.tpl.html';
    dzForm.registerField(field, {
      templateUrl: templateUrl
    });
  }
}]);

// converts a Date object
// to and from the required format
// for a date input
fieldsModule.directive('dzInputDate', ['dateFilter', function inputDateDirective(dateFilter) {
  return {
    require: 'ngModel',
    link: function inputDateLinkFn($scope, $element, $attrs, ngModel) {
      ngModel.$formatters.unshift(function formatDateInput() {
        var modelValue = ngModel.$modelValue;
        if(!(modelValue instanceof Date)) {
          modelValue = new Date(modelValue);
        }
        return dateFilter(modelValue, 'yyyy-MM-dd');
      });

      ngModel.$parsers.unshift(function parseDateInput(viewValue) {
        return new Date(viewValue);
      });
    }
  };
}]);