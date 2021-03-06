Vue.view("page-share-social", {
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		}
	},
	data: function() {
		return {
			configuring: false
		}
	},
	methods: {
		configure: function() {
			if (!this.cell.state.share) {
				Vue.set(this.cell.state, "share", []);
			}
			this.configuring = true;	
		},
		analyze: function(provider) {
			if (this.$services.analysis && this.$services.analysis.emit) {
				this.$services.analysis.emit("share-" + provider, {url:window.location}, null, true);
			}
		},
		generateLink: function(provider) {
			var url = encodeURIComponent(window.location);
			var title = null;
			var summary = null;
			var source = null;
			var tags = [];
			var result = null;
			if (provider == "facebook") {
				result = "https://www.facebook.com/sharer/sharer.php?u=" + url;
			}
			else if (provider == "twitter") {
				result = "http://twitter.com/share?url=" + url;
				if (title != null) {
					result += "&text=" + title;
				}
				if (tags != null && tags.length) {
					result += "&hashtags=" + tags.join(",");
				}
			}
			else if (provider == "google-plus") {
				result = "https://plus.google.com/share?url=" + url;
			}
			else if (provider == "linkedin") {
				result = "https://www.linkedin.com/shareArticle?mini=true&url=" + url;
				if (title != null) {
					result += "&&title=" + title;
				}
				if (summary != null) {
					result += "&summary=" + summary;
				}
				if (source != null) {
					result += "&source=" + source;
				}
			}
			else if (provider == "email") {
				result = "mailto:?subject=" + (title ? title : url);
				if (title) {
					result += "&body=" + url;
				}
			}
			else if (provider == "pinterest") {
				result = "https://pinterest.com/pin/create/button/?url=" + url;
				if (title != null) {
					result += "&description=" + title;
				}
			}
			return result;
		}
	}
});