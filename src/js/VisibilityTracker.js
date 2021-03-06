/*
Copyright 2012 Eiji Kitamura

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@gmail.com)
*/
var VisibilityTracker = (function() {
  var tracker = [];
  var session = (function() {
    var session = function(winId) {
      this.winId = winId;
      this.start = new Date();
      this.end = null;
    };
    session.prototype = {
      endSession: function() {
        this.end = new Date();
      }
    };
    return function(winId) {
      return new session(winId);
    };
  })();
  chrome.windows.getCurrent(function(win) {
      tracker.push(new session(win.id));
  });
  return {
    winChanged: function(win) {
      var last = tracker.length-1;
      if (!win) {
        tracker[last].endSession();
        return;
      }
      if (win.tabs.length == 1 && win.tabs[0].url.match(/^chrome(|-devtools):\/\//i)) {
        return;
      }
      if (tracker[last].end === null)
        tracker[last].endSession();
      tracker.push(new session(win.id));
    },
    getSummary: function(windowHistory) {
      var times = {};
      tracker.forEach(function(session) {
        var winId = session.winId;
        if (!times[winId]) {
          times[winId] = {};
          times[winId].duration = 0;
          times[winId].title = windowHistory[winId] ? windowHistory[winId].title : session.winId;
        }
        var end = session.end ? session.end.getTime() : (new Date()).getTime();
        var duration = ~~((end - session.start.getTime()) / 1000);
        times[winId].duration += duration;
      })
      return times;
    },
    getTimeSummary: function(windowHistory) {
      var copy = [];
      tracker.forEach(function(session) {
        var _session = {};
        _session.winId = session.winId;
        _session.start = session.start.getTime();
        _session.end = session.end ? session.end.getTime() : null;
        _session.projectName = windowHistory[_session.winId] ? windowHistory[_session.winId].title : _session.winId;
        copy.push(_session);
      });
      return copy;
    }
  };
})();