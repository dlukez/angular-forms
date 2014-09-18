Angular Forms
=============

Overview
--------

Angular Forms provides a generic way to define forms for creating and editing entities. Forms are defined in JSON and in future, will be able to be built using a generic form builder tool, which will significantly aid in creating forms for non-developers. Implementing a form involves a single directive that renders a form based on the provided JSON.

### Why

To allow non-devs to configure forms!

### Dependencies

Requires Angular >= 1.2.

Features
--------

1. Automatically render a form based on a JSON schema
2. Allows dynamic control of field state using expressions (disabled, required, visible)
3. Easily plug in your own custom fields

### Bootstrap Themed

At the moment, the field/form template is based on Bootstrap. That means if you include Bootstrap in your project,
everything will render nicely! In the future I'll add support for different frameworks (such as Foundation) and
make sure that things can be reformatted easily.

Syntax
------

- **bold** = required
- *italics* = required for certain fields

### Form

- **fields** (array) - an array of fields.
- title (string) - the title for the form.
- description (string) - the description for the form.

### Field

- **name** (string) - the name of the form field and the target property on the model.
- **label** (string) - a label for the field.
- **type** (string) - the type of the field. Valid values include:
    - text - a single-row text input.
    - textarea - a multi-row text input.
    - number - a standard number input.
    - date - a standard date input.
    - checkbox - a standard checkbox input.
    - select - a standard dropdown box (requires **options**).
    - radio - a standard set of radio buttons (requires **options**).
    - hidden - an invisible control that stores a value.
    - form - an embedded subform (define using the Form syntax).
- *options* (object|array) - an array of options (explicit order), or an object in the form of { value: label, value: label } (ascending order of value; shorter to write).
- helpText (string) - any help text to accompany the input.
- value (string|int|interpolated_expression) - the initial/default value.
- visible (expression) - controls whether the field is visible.
- required (expression) - controls whether the field is required.
- disabled (expression) - controls whether the field is disabled.
- properties (object) - a map of additional HTML properties to set on any plain input element (text, textarea, number, checkbox, date, select or hidden).

### Option

Used with any control that requires a list of values to choose from.

- **value** - the value that will be set if the option is selected.
- **label** - the label to be displayed.

### Expression

Expressions allow us to dynamically control the state of a field.
The context for an expression contains the following properties that can be accessed:

- *field_name* - any sibling field, referenced by name.
- this - the current field.
- $parent - the parent context (use in sub-forms to access parent fields).
- $form - the current form.
- $root - the root level form.

We have access to our form definitions in case we want to
attach additional data to them that we can refer to in our expressions.

Expressions are compiled and executed using Angular's $interpolate and $parse services.

### Interpolated Expression

Interpolated expressions are just like expressions, but must be wrapped
in double curly braces, e.g. {{ myName.value }}.

Example
-------

Here is an example form schema for a Service Request:

    $scope.form = {
        title: "New Service Request",
        description: "Use this form to create a new service request.",
        fields: [
            {
                name: "serviceRequestId",
                type: "hidden"
            },
            {
                name: "teamName",
                label: "Team Name",
                type: "text"
            },
            {
                name: "orgUnitId",
                label: "Business Unit",
                type: "number",
                helpText: "Please contact your business unit representative if you cannot find your cost centre."
            },
            {
                name: "chargeToOrgUnitId",
                type: "hidden",
                value: "{{ businessUnit.value }}",
            },
            {
                name: "requestTypeId",
                label: "Reason for request",
                type: "select",
                required: true,
                options: [
                    { value: 1, label: "Get some stuff" },
                    { value: 2, label: "Drop some stuff" },
                    { value: 3, label: "New staff" },
                    { value: 4, label: "Other" }
                ]
            },
            {
                name: "serviceTypeOther",
                label: "Other",
                type: "text",
                visible: "requestTypeId.value === 4",
                required: "this.visible",
                disabled: "!this.visible"
            },
            {
                name: "contactPerson",
                type: "form",
                fields: [
                    {
                        name: "serviceRequestId",
                        type: "hidden",
                        value: "{{ $parent.serviceRequestId }}"
                    },
                    {
                        name: "relationshipTypeId",
                        type: "hidden",
                        value: 3043
                    },
                    {
                        name: "personId",
                        label: "Contact person",
                        type: "number",
                        required: true
                    }
                ]
            },
            {
                name: "additionalInstructions",
                label: "Describe your request",
                type: "textarea"
            },
            {
                name: "specificRequirements",
                label: "Any specific requirements?",
                type: "radio",
                options: [
                    { value: 1, label: "Yes" },
                    { value: 0, label: "No" }
                ],
                value: 0
            },
            {
                name: "moreInformation",
                label: "Enter more information",
                type: "textarea",
                visible: "specificRequirements.value"
            },
            {
                name: "completionDate",
                label: "Proposed completion date",
                type: "date"
            }
        ]
    };

    // where the values will be written
    $scope.request = {};

To render the form, include the module in your application:

    angular.module('myApp', ['dz.forms']);

Then include it in your HTMl:

    <dz-form form="form" model="request"></dz-form>


TODO
----

- Repeater for fields
- Include other themes (currently based on bootstrap)
- Form builder
- File upload plugin?