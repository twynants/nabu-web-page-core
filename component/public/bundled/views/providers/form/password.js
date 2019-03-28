Vue.component("page-form-input-password-configure", {
	template: "<n-form-section>"
		+ "	<n-form-text v-model='field.repeatLabel' label='Label for password repeat'/>"
		+ "	<n-form-text v-model='field.regex' label='Security Regex'/>"
		+ "	<n-form-text v-model='field.regexLabel' label='Regex Label' placholder='%{The password should be at least 8 characters long and contain one capital, one lowercase letter and a number}'/>"
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
		if (!this.field.regex) {
			Vue.set(this.field, "regex", "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}");
		}
	}
});

Vue.component("page-form-input-password", {
	template: "<n-form-section ref='form'><n-form-text type='password'"
			+ "		:edit='!readOnly'"
			+ "		:placeholder='placeholder'"
			+ "		:schema='schema'"
			+ "		:pattern-comment='$services.page.translate(regexLabel)'" 
			+ "		:pattern='field.regex'"
			+ "		@input=\"function(newValue) { $emit('input', newValue) }\""
			+ "		:label='label'"
			+ "		:value='value'"
			+ "		:name='field.name'"
			+ "		:timeout='timeout'"
			+ "		:disabled='disabled'/>"
			+ "	<n-form-text type='password' v-if='field.repeatLabel && !readOnly'"
			+ "		:placeholder='placeholder'"
			+ "		:schema='schema'"
			+ "		:label='$services.page.translate(field.repeatLabel)'"
			+ "		v-model='repeat'"
			+ "		:name='field.name + 2'"
			+ "		:timeout='timeout'"
			+ "		:validator='validatePassword'"
			+ "		:disabled='disabled'/></n-form-section>",
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
	computed: {
		regexLabel: function() {
			return this.field.regexLabel != null && this.field.regexLabel != "" 
				? this.$services.page.interpret(this.field.regexLabel, this)
				: "%{The password should be at least 8 characters long and contain one capital, one lowercase letter and a number}";
		}
	},
	created: function() {
		console.log("regex is", this.field.regex);	
	},
	data: function() {
		return {
			repeat: null
		}
	},
	methods: {
		validate: function(soft) {
			var messages = this.$refs.form.validate(soft);
			return messages;
		},
		validatePassword: function(password2) {
			var messages = [];
			if (this.value != password2) {
				messages.push({
					soft: true,
					code: "same",
					severity: "error",
					title: "%{The two passwords don't match}"
				});
			}
			return messages;
		},
	}
});