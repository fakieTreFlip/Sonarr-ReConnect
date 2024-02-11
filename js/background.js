const background = {
  settings: {},
  init: function() {
    this.getOptions(() => {
      this.fetchDataPeriodically();
      this.listenForAlarms();
    });
  },
  getOptions: function(callback) {
    chrome.storage.sync.get({
      apiKey: '',
      url: 'http://localhost:8989',
      numberOfDaysCalendar : 7,
      wantedItems: 15,
      historyItems: 15,
      calendarEndDate: 7,
      backgroundInterval : 5,
      sonarrConfig : {},
      showBadge : false
    }, (items) => {
      console.log('get options from chrome storage');
      this.settings = {
        apiKey: items.apiKey,
        url: items.url,
        numberOfDaysCalendar: items.numberOfDaysCalendar,
        wantedItems: items.wantedItems,
        historyItems: items.historyItems,
        calendarEndDate: items.calendarEndDate,
        sonarrConfig: items.sonarrConfig,
        backgroundInterval: items.backgroundInterval,
        showBadge: items.showBadge,
        mode: "calendar"
      };
      if (typeof callback === "function") {
        callback.call(this);
      }
    });
  },
  fetchDataPeriodically: function() {
    chrome.alarms.create("fetchData", {periodInMinutes: Number(this.settings.backgroundInterval)});
  },
  listenForAlarms: function() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === "fetchData") {
        this.getOptions(this.fetchData.bind(this));
      }
    });
  },
  fetchData: async function() {
    const baseUrl = this.settings.url;
    const apikey = this.settings.apiKey;
    const wantedItems = this.settings.wantedItems;
    const url = `${baseUrl}api/v3/wanted/missing?page=1&pageSize=${wantedItems}&sortKey=airDateUtc&sortDir=desc&includeSeries=true&apikey=${apikey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const numMissingEpisodes = data.totalRecords;
      this.updateBadge(numMissingEpisodes.toString());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  },
  updateBadge: function(text) {
    if (text && this.settings.showBadge === "true" || parseInt(text, 10) > 0) {
      chrome.action.setBadgeText({ text: text.toString() });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
};

background.init();
