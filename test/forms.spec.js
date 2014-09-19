describe('angular forms', function () {
  var el, $scope;

  // different configurations for src/ and release/
  try {
    angular.module('dz.forms.fields.templates');
  } catch(err) {
    angular.module('dz.forms.fields.templates', []);
  }

  beforeEach(module('dz.forms.templates'));
  beforeEach(module('dz.forms'));
  beforeEach(inject(function ($rootScope, $compile) {
    $scope = $rootScope.$new();
    $scope.model = {};
    el = $compile('<dz-form form="form" model="model" disabled="disabled"></dz-form>')($scope);
    $scope.$apply();
  }));

  describe('form', function () {
    describe('directive', function () {
      beforeEach(function () {
        $scope.form = {
          title: 'Form Title',
          description: 'This is a form description.'
        };
        $scope.disabled = false;
        $scope.$apply();
      });

      it('should create a form', function () {
        expect(el[0].nodeName.toLowerCase()).toEqual('form');
      });

      it('should include a title', function () {
        expect(el[0].querySelector('.dz-form-title').innerHTML).toEqual($scope.form.title);
      });

      it('should include a description', function () {
        expect(el[0].querySelector('.dz-form-description').innerHTML).toEqual($scope.form.description);
      });

      it('should support being disabled', function () {
        $scope.disabled = true;
        $scope.$apply();
        expect(el.find('fieldset').attr('disabled')).toEqual('disabled' );
      });
    });
  });

  describe('field', function () {
    var dzForm,
        textField = { template: '<input type="text" ng-model="model[field.name]" class="text-field" ng-disabled="disabled()" ng-required="required()" />' };

    beforeEach(inject(function (_dzForm_) {
      dzForm = _dzForm_;
      dzForm.registerField('text', textField);
      $scope.form = {
        fields: [
          {
            name: 'test',
            type: 'text',
            label: 'Test'
          }
        ]
      };
      $scope.$apply();
    }));

    describe('definition', function () {
      it('should support registering a field type', function () {
        expect(dzForm.getField('text').template).toEqual(textField.template);
        expect(el[0].querySelectorAll('.text-field').length).toEqual(1);
      });

      it('should support registering a field type after load', function () {
        $scope.form.fields.push({ name: 'numberTest', type: 'number', label: 'Number' });
        $scope.$apply();
        expect(el[0].querySelectorAll('.number-field').length).toEqual(0);
        dzForm.registerField('number', { template: '<input type="number" ng-model="model[field.name]" class="number-field" />' });
        $scope.$apply();
        expect(el[0].querySelectorAll('.number-field').length).toEqual(1);
      });

      it('should support unregistering a field type', function () {
        dzForm.unregisterField('text');
        $scope.$apply();
        expect(dzForm.getField('text')).toBeNull();
        expect(el[0].querySelectorAll('.text-field').length).toEqual(0);
      });

      it('should support changing a field type', function () {
        dzForm.registerField('number', { template: '<input type="number" ng-model="model[field.name]" class="number-field" />' });
        $scope.form.fields[0].type = 'number';
        $scope.$apply();
        expect(el[0].querySelectorAll('.number-field').length).toEqual(1);
      });

      it('can be specified using an object', function () {
        $scope.form.fields = {
          'test': {
            name: 'test',
            type: 'text',
            label: 'Test'
          }
        };
        $scope.$apply();
        expect(dzForm.getField('text').template).toEqual(textField.template);
        expect(el[0].querySelectorAll('.text-field').length).toEqual(1);
      });

      it('templateUrl should work', inject(function ($httpBackend) {
        // update the field
        dzForm.registerField('test', { templateUrl: 'test.tpl.html' });
        $scope.form.fields = [
          {
            name: 'test',
            type: 'test',
            label: 'Test'
          }
        ];

        // setup the http service
        $httpBackend.expectGET('test.tpl.html').respond('<input type="text" ng-model="model[field.name]" class="test-field" ng-disabled="disabled()" ng-required="required()" />');

        // an apply shouldn't create the element yet, because we haven't flushed the http request
        $scope.$apply();
        expect(el[0].querySelectorAll('.test-field').length).toEqual(0);

        // after flushing, we should have one text field
        $httpBackend.flush();
        expect(el[0].querySelectorAll('.test-field').length).toEqual(1);

        $httpBackend.verifyNoOutstandingExpectation();
      }));
    });

    describe('dynamic state', function () {
      describe('visible', function () {
        function testVisible(visible) {
          if(visible == null) visible = true;
          expect(el[0].querySelectorAll('.dz-form-field').length).toBe(1);
          expect(el[0].querySelectorAll('.dz-form-field.ng-hide').length).toBe(visible ? 0 : 1);
        }
        
        it('should default to true', testVisible);

        it('should correctly show field', function () {
          $scope.form.fields[0].visible = 'test.value !== \'hide-me\'';
          $scope.model.test = 'sup';
          $scope.$apply();
          testVisible();
        });

        it('should correctly hide field', function () {
          $scope.form.fields[0].visible = 'test.value !== \'hide-me\'';
          $scope.model.test = 'hide-me';
          $scope.$apply();
          testVisible(false);
        });
      });

      describe('required', function () {
        function testRequired(required) {
          expect(el[0].querySelectorAll('.text-field').length).toBe(1);
          expect(el[0].querySelectorAll('.text-field[required]').length).toBe(required ? 1 : 0);
        }

        it('should default to false', function () {
          testRequired(false)
        });

        it('should correctly make field optional', function () {
          $scope.form.fields[0].required = 'test.value === \'require-me\'';
          $scope.model.test = 'sup';
          $scope.$apply();
          testRequired(false);
        });

        it('should correctly make field required', function () {
          $scope.form.fields[0].required = 'test.value === \'require-me\'';
          $scope.model.test = 'require-me';
          $scope.$apply();
          testRequired(true);
        });
      });
      
      describe('disabled', function () {
        function testDisabled(disabled) {
          expect(el[0].querySelectorAll('.text-field').length).toBe(1);
          expect(el[0].querySelectorAll('.text-field[disabled]').length).toBe(disabled ? 1 : 0);
        }

        it('should default to false', function () {
          testDisabled(false)
        });

        it('should correctly enable field', function () {
          $scope.form.fields[0].disabled = 'test.value === \'require-me\'';
          $scope.model.test = 'sup';
          $scope.$apply();
          testDisabled(false);
        });

        it('should correctly disable field', function () {
          $scope.form.fields[0].disabled = 'test.value === \'require-me\'';
          $scope.model.test = 'require-me';
          $scope.$apply();
          testDisabled(true);
        });
      });
    });

    describe('sub forms', function () {
      beforeEach(inject(function ($templateCache) {
        dzForm.registerField('form', { template: $templateCache.get('fields/form.tpl.html') });
        $scope.form.fields.push({
          name: 'sub',
          type: 'form',
          fields: [
            {
              name: 'test',
              type: 'text',
              label: 'hey'
            }
          ]
        });
        $scope.$apply();
      }));

      it('should render', function () {
        expect(el[0].querySelectorAll('.dz-sub-form').length).toEqual(1);
      });

      it('should render fields', function () {
        expect(el[0].querySelectorAll('.dz-sub-form .text-field').length).toEqual(1);
      });

      it('should update the model', function () {
        var textInput = el[0].querySelector('.dz-sub-form .text-field');
        textInput.value = 'sub-form input';
        dispatchEvent(textInput, 'change', false, true);
        expect($scope.model.sub.test).toEqual(textInput.value);
      });
    });
  });
});

function dispatchEvent(el, type, bubble, cancelable) {
  var event = document.createEvent('Event');
  event.initEvent(type, bubble, cancelable);
  el.dispatchEvent(event);
}