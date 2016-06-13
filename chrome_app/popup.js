var bandcampMultiTag = angular.module('multiTagApp', [])
    .config([
    	'$compileProvider',
    	function ($compileProvider) {
        	//  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)/
        	$compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
    }
]);

function Tag(name) {
    this.name = name;
    this.isCaching = false;
}

bandcampMultiTag.controller('tagsController', function ($scope) {
    $scope.albums = [];
  	$scope.isSearching = false;
    $scope.isCachingTags = false;
  	$scope.retryTime = 5;
  	$scope.tags = [];
    $scope.latestRequestId = 0;
    $scope.userSearchCount = 0;
    $scope.canShowReviewSuggestion = true;
    $scope.showReviewSuggestionNow = false;
    $scope.reviewSuggestionSearchCount = 50;

    chrome.storage.local.get({
          "lastUsedTags" : [],
          "userSearchCount" : 0,
          "canShowReviewSuggestion" : true
        }, result => {
            $scope.userSearchCount = result.userSearchCount;
            $scope.canShowReviewSuggestion = result.canShowReviewSuggestion;
            $scope.$apply(() => {
                result.lastUsedTags.forEach(x => { $scope.addTag(x); });
        });
    });

  	$scope.addInputTag = function() {
  	    var newTag = $scope.newTag.replace(" ", "-");
  	    $scope.addTag(newTag);
  	    $scope.newTag = null;
        $scope.updateUserSearchCount();
   	};

   	$scope.addTag = function(tag) {
  	    if($scope.tags.map(x => x.name).indexOf(tag) == -1) {
    	      $scope.tags.push(new Tag(tag));
    	      $scope.searchTags();
  	    }
  	};

    $scope.updateUserSearchCount = function() {
        $scope.userSearchCount += 1;
        chrome.storage.local.set({ userSearchCount: $scope.userSearchCount });

        if($scope.canShowReviewSuggestion &&
          $scope.userSearchCount % $scope.reviewSuggestionSearchCount == 0)
        {
            $scope.showReviewSuggestionNow = true;
        }
    };

   	$scope.removeTag = function(tag) {
        var i = $scope.tags.indexOf(tag);
        if(i != -1) {
            $scope.tags.splice(i, 1);
        }
        $scope.searchTags();
  	};

    $scope.remindLater = function() {
        $scope.showReviewSuggestionNow = false;
    };

    $scope.neverShowSuggestion = function() {
        $scope.canShowReviewSuggestion = false;
        chrome.storage.local.set({ canShowReviewSuggestion: false });
    };

  	$scope.searchTags = function() {
        $scope.isSearching = true;
        chrome.storage.local.set({ lastUsedTags: $scope.tags.map(x => x.name) });
    		$scope.makeRequest($scope.tags.map(x => x.name), function(requestId, albums) {
            if(requestId != $scope.latestRequestId) {
                return;
            }

            $scope.$apply(() => {
                $scope.albums = albums;
                $scope.isCachingTags = false;
                $scope.tags.forEach(x => x.isCaching = false);
                $scope.isSearching = false;
            });
    		});
  	};

  	$scope.makeRequest = function(tags, onDone) {
        $scope.latestRequestId += 1;
        var currentRequestId = $scope.latestRequestId;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:8079/v1/albums", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = () => {
            if(xhr.readyState != 4) {
                return;
            }

            if(xhr.status == 200) {
                onDone(currentRequestId, JSON.parse(xhr.responseText));
            }
            else if(xhr.status == 202) {
                var uncachedTags = JSON.parse(xhr.responseText).data;
                $scope.markUncachedTags(uncachedTags);

                setTimeout(() => {
                    $scope.makeRequest(tags, onDone);
                }, $scope.retryTime*1000);
            }
        }

        xhr.send(JSON.stringify(tags));
  	};

    $scope.markUncachedTags = function(uncachedTags) {
        $scope.$apply(() => {
          $scope.isCachingTags = true;
          uncachedTags.forEach(tag => {
              var matchingIndex = $scope.tags.map(x => x.name).indexOf(tag);
              if(matchingIndex != -1) {
                  $scope.tags[matchingIndex].isCaching = true;
              }
          })
        });
    };
});