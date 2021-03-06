// allow complex formatting (e.g. multiple fields etc)
// can also allow complex extraction, though unlikely necessary

Vue.component("page-form-input-enumeration-operation-configure", {
	template: "<n-form-section class='enumeration'>"
			+ "		<n-form-combo v-model='field.enumerationOperation'"
			+ "			label='Enumeration Operation'"
			+ "			:filter='getEnumerationServices'/>"
			+ "		<n-form-switch v-model='field.enumerationOperationLabelComplex' label='Complex Enumeration Label'/>"
			+ "		<n-form-combo v-if='field.enumerationOperation && !field.enumerationOperationLabelComplex' v-model='field.enumerationOperationLabel' label='Enumeration Label'"
			+ "			:filter='function() { return getEnumerationFields(field.enumerationOperation) }'/>"
			+ "		<n-form-combo v-if='field.enumerationOperation' v-model='field.enumerationOperationValue' label='Enumeration Value'"
			+ "			:filter='function() { return getEnumerationFields(field.enumerationOperation) }'/>"
			+ "		<n-form-combo v-if='field.enumerationOperation' v-model='field.enumerationOperationQuery' label='Enumeration Query'"
			+ "			:filter='function() { return getEnumerationParameters(field.enumerationOperation) }'/>"
			+ "		<n-form-combo v-if='field.enumerationOperation && field.enumerationOperationValue' :filter='function() { return getEnumerationParameters(field.enumerationOperation) }' v-model='field.enumerationOperationResolve' label='Resolve Field'/>"
			+ "		<page-fields-edit :allow-multiple='false' fields-name='enumerationFields' v-if='field.enumerationOperation && field.enumerationOperationLabelComplex' :cell='{state:field}' :page='page' :keys='getEnumerationFields(field.enumerationOperation)' :allow-editable='false'/>"
			+ "		<n-page-mapper v-if='field.enumerationOperation && hasMappableEnumerationParameters(field)'"
			+ "			v-model='field.enumerationOperationBinding'"
			+ "			:from='$services.page.getAvailableParameters(page, cell)'"
			+ "			:to='getMappableEnumerationParameters(field)'/>"
			+ "</n-form-section>",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		// the fragment this image is in
		field: {
			type: Object,
			required: true
		}
	},
	created: function() {
		if (!this.field.enumerationProvider) {
			Vue.set(this.field, "enumerationProvider", null);
		}
		this.normalize(this.field);
	},
	methods: {
		enumerationFilter: function(value) {
			var providers = nabu.page.providers("page-enumerate").map(function(x) { return x.name });
			if (value) {
				providers = providers.filter(function(x) { return x.toLowerCase().indeOf(value.toLowerCase()) >= 0 });
			}
			providers.sort();
			return providers;
		},
		normalize: function(field) {
			if (!field.enumerationOperation) {
				Vue.set(field, "enumerationOperation", null);
			}
			if (!field.enumerationOperationLabel) {
				Vue.set(field, "enumerationOperationLabel", null);
			}
			if (!field.enumerationOperationValue) {
				Vue.set(field, "enumerationOperationValue", null);
			}
			if (!field.enumerationOperationQuery) {
				Vue.set(field, "enumerationOperationQuery", null);
			}
			if (!field.enumerationOperationBinding) {
				Vue.set(field, "enumerationOperationBinding", {});
			}
		},
		// copy/pasted from the table getOperations
		getEnumerationServices: function(name) {
			var self = this;
			return this.$services.page.getOperations(function(operation) {
				// must be a get
				var isAllowed = operation.method.toLowerCase() == "get"
					// and contain the name fragment (if any)
					&& (!name || operation.id.toLowerCase().indexOf(name.toLowerCase()) >= 0)
					// must have _a_ response
					&& operation.responses["200"];
				// we also need at least _a_ complex array in the results
				if (isAllowed) {
					var schema = operation.responses["200"] ? operation.responses["200"].schema : null;
					if (schema) {
						var definition = self.$services.swagger.definition(schema["$ref"]);
						// now we need a child in the definition that is a record array
						// TODO: we currently don't actually check for a complex array, just any array, could be an array of strings...
						isAllowed = false;
						if (definition.properties) {
							Object.keys(definition.properties).map(function(field) {
								if (definition.properties[field].type == "array") {
									isAllowed = true;
								}
							});
						}
					}
				}
				return isAllowed;
			}).map(function(x) {
				 return x.id;
			});	
		},
		getEnumerationFields: function(operationId) {
			var fields = [];
			if (this.$services.swagger.operations[operationId]) {
				var resolved = this.$services.swagger.resolve(this.$services.swagger.operations[operationId].responses["200"]);
				Object.keys(resolved.schema.properties).map(function(property) {
					if (resolved.schema.properties[property].type == "array") {
						nabu.utils.arrays.merge(fields, Object.keys(resolved.schema.properties[property].items.properties));
					}
				});
			}
			return fields;
		},
		getEnumerationParameters: function(operationId) {
			var parameters = this.$services.swagger.operations[operationId].parameters;
			return parameters ? parameters.map(function(x) { return x.name }) : [];
		},
		getMappableEnumerationParameters: function(field) {
			var result = {
				properties: {}
			};
			if (this.$services.swagger.operations[field.enumerationOperation]) {
				Object.keys(this.$services.page.getInputBindings(this.$services.swagger.operations[field.enumerationOperation])).map(function(key) {
					if (key != field.enumerationOperationQuery) {
						result.properties[key] = {
							type: "string"
						}
					}
				});
			}
			return result;
		},
		hasMappableEnumerationParameters: function(field) {
			var amount = Object.keys(this.getMappableEnumerationParameters(field).properties).length;
			return amount > 0;
		}
	}
});

Vue.component("page-form-input-enumeration-operation", {
	template: "<n-form-combo ref='form' :filter='enumerationFilter' :formatter='enumerationFormatter' :extracter='enumerationExtracter' :resolver='enumerationResolver'"
			+ "		:edit='!readOnly'"
			+ "		:placeholder='placeholder'"
			+ "		@input=\"function(newValue) { $emit('input', newValue) }\""
			+ "		v-bubble:label"
			+ "		:timeout='600'"
			+ "		:label='label'"
			+ "		:value='value'"
			+ "		:schema='schema'"
			+ "		:disabled='disabled'/>",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		value: {
			required: true
		},
		label: {
			type: String,
			required: false
		},
		timeout: {
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		schema: {
			type: Object,
			required: false
		},
		readOnly: {
			type: Boolean,
			required: false
		},
		placeholder: {
			type: String,
			required: false
		}
	},
	data: function() {
		return {
			provider: null
		}
	},
	created: function() {
		console.log("created", this.field.enumerationOperation);	
	},
	methods: {
		// enumerationOperation: null,
		// enumerationFormatter
		// enumerationOperationLabel: null,
		// enumerationOperationValue: null,
		// enumerationOperationQuery: null,
		// enumerationOperationBinding: {}
		enumerationFilter: function(value) {
			return this.enumerationFilterAny(value, false);
		},
		enumerationFilterAny: function(value, asResolve) {
			if (!this.field.enumerationOperation) {
				return [];
			}
			var parameters = {
				limit: 20
			};
			if (!asResolve && this.field.enumerationOperationQuery) {
				parameters[this.field.enumerationOperationQuery] = value;
			}
			else if (asResolve && this.field.enumerationOperationResolve) {
				parameters[this.field.enumerationOperationResolve] = value;
			}
			// map any additional bindings
			if (this.field.enumerationOperationBinding) {
				var self = this;
				var pageInstance = self.$services.page.getPageInstance(self.page, self);
				Object.keys(this.field.enumerationOperationBinding).map(function(key) {
					var target = parameters;
					var parts = key.split(".");
					for (var i = 0; i < parts.length - 1; i++) {
						if (!target[parts[i]]) {
							target[parts[i]] = {};
						}
						target = target[parts[i]];
					}
					target[parts[parts.length - 1]] = self.$services.page.getBindingValue(pageInstance, self.field.enumerationOperationBinding[key], self);
				});
			}
			return this.$services.swagger.execute(this.field.enumerationOperation, parameters, function(response) {
				var result = null;
				if (response) {
					Object.keys(response).map(function(key) {
						if (response[key] instanceof Array) {
							result = response[key];
						}
					});
				}
				return result ? result : [];
			});
		},
		enumerationResolver: function(value) {
			if (this.field.enumerationOperationResolve && this.field.enumerationOperationValue) {
				return this.enumerationFilterAny(value, true);
			}
			return value;
		},
		enumerationFormatter: function(value) {
			if (value == null) {
				return null;
			}
			// we want complex labels
			else if (this.field.enumerationOperationLabelComplex) {
				var pageInstance = this.$services.page.getPageInstance(this.page, this);
				var storageId = "enumerate." + this.field.enumerationOperation + "." + value[this.field.enumerationOperationValue];
				storageId = storageId.replace(/\./g, "_");
				
				if (pageInstance.retrieve(storageId) != null) {
					return pageInstance.retrieve(storageId);
				}
				
				var self = this;
				pageInstance.store(storageId, "");
				
				setTimeout(function() {
					var parameters = nabu.utils.objects.deepClone({
						page: self.page,
						cell: {state: self.field},
						edit: false,
						data: value,
						label: false,
						fieldsName: "enumerationFields"
					});
					var component = new nabu.page.views.PageFields({ propsData: parameters, updated: function() {
						var content = component.$el.innerHTML.replace(/<[^>]+>/g, "");
						if (pageInstance.retrieve(storageId) != content) {
							pageInstance.store(storageId, content);
						}
					} });
					component.$mount();
				}, 1);
				//pageInstance.store(storageId, component.$el.innerHTML.replace(/<[^>]+>/g, ""));
				return pageInstance.retrieve(storageId);
			}
			else if (this.field.enumerationFormatter) {
				return this.field.enumerationFormatter(value);
			}
			else if (this.field.enumerationOperationLabel) {
				console.log("rendering", this.field.name);
				return value[this.field.enumerationOperationLabel];
			}
			else {
				return value;
			}
		},
		enumerationExtracter: function(value) {
			if (value == null) {
				return null;
			}
			else if (this.field.enumerationOperationValue) {
				return value[this.field.enumerationOperationValue];
			}
			else {
				return value;
			}
		},
		validate: function(soft) {
			return this.$refs.form.validate(soft);
		}
	}
});

