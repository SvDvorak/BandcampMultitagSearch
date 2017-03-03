
require("./extensions");

module.exports = Seeder = function(updater, bandcampApi, log) {
	this.updater = updater;
	this.bandcampApi = bandcampApi;
	this.alreadySeeded = {}
	this.log = log;
};

Seeder.prototype = {
	seed: function(tag, onResult) {
		var seeder = this;
		this.log("Seeding tags for all albums under " + tag);

		seeder.bandcampApi.getAlbumsForTag(tag, function(newAlbums) {
			seeder.updateTagsForAllAlbums(newAlbums.slice(0, 500), [ tag ], onResult);
		});
	},

	updateTagsForAllAlbums: function(albums, previousTags, onResult) {
		var seeder = this;
		var count = albums.length;

		if(count <= 0) {
			onResult(previousTags.getUnique().BCvalues());
			return;
		}

		seeder.bandcampApi.getTagsForAlbum(albums[count - 1], function(newTags) {
			tags = previousTags.concat(newTags);
			count = count - 1;
	        albums.splice(count, 1);
	        seeder.updateTagsForAllAlbums(albums, tags, onResult);
		});
	}
};

Array.prototype.getUnique = function() {
    var seen = {};
    return this.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}