
var test = require('tape');
var _ = require('lodash');

var kodels = require('../');
var modelConfig = require('./_fixtures').modelConfig;
var makeMongo   = require('./_fixtures').makeMongo;
var eventData   = require('./_fixtures').eventData;
var coll = makeMongo();


test('model creation', function (t) {
  var config_ = _.cloneDeep(modelConfig);
  var EventModel = kodels.createModel(config_, coll);
  
  t.deepEquals(EventModel.$meta, config_.$meta, 'loads meta');
  // static methods are now bond to the collection -- this test is broken
  // t.equals(EventModel.getPageTitle, modelConfig.$statics.getPageTitle, 'attaches static methods');
  t.equals(EventModel.getPageTitle(), 'My events', 'statics methods work');

  t.test('without name', function (tt) {
    var config_ = _.cloneDeep(modelConfig);
    delete config_.$meta.name;
    tt.throws(function () { kodels.createModel(config_, coll); }, 'throws');
    tt.end();
  });
  
  t.test('without meta', function (tt) {
    var config_ = _.cloneDeep(modelConfig);
    delete config_.$meta;
    tt.throws(function () { kodels.createModel(config_, coll); }, 'throws');
    tt.end();
  });
  
  t.test('with invalid attribute definition', function (tt) {
    var config_;
    
    config_ = _.cloneDeep(modelConfig);
    config_.title = { type: 'string', defaultValue: 'foo', validate: [notBar] };
    tt.throws(function () { kodels.createModel(config_, coll); }, 'throws if type is wrong');
    
    config_ = _.cloneDeep(modelConfig);
    config_.title = { type: String, validate: [notBar] };
    tt.throws(function () { kodels.createModel(config_, coll); }, 'throws if defaultValue is not set');
    
    config_ = _.cloneDeep(modelConfig);
    config_.title = { type: String, validate: notBar };
    tt.throws(function () { kodels.createModel(config_, coll); }, 'throws if validate is not an array');
    
    tt.end();
  });
  
  t.end();
});


test('instance creation', function (t) {
  var config_ = _.cloneDeep(modelConfig);
  var EventModel = kodels.createModel(config_, coll);
  var eventData_ = _.cloneDeep(eventData);
  var myEvent = new EventModel.create(eventData_);
  
  t.deepEquals(myEvent.title, eventData_.title, 'correctly sets attributes');
  
  myEvent.title = 'xyz!';
  t.deepEquals(myEvent.title, 'xyz!', 'correctly updates attributes');
  t.throws(function () { myEvent.$meta = 'hacked'; }, 'but not reserved ones');
  
  t.throws(function () { myEvent.title = 'bar'; }, 'throws when violating validator');
  t.deepEquals(myEvent.title, 'xyz!', '...and does not change any value');
  
  t.equals(myEvent.displayTitle, config_.$fns.displayTitle, 'attaches instance methods');
  t.equals(myEvent.$model.$meta, config_.$meta, 'attaches reserved attributes');
  t.equals(typeof myEvent.save, 'function', 'attaches internal methods');
  t.throws(function () { return myEvent.cinema; }, 'throws when getting nonexistant attribute');
  
  eventData_.title = 'xyz!';
  t.deepEquals(myEvent.toObject(), eventData_, 'correctly implements .toObject');
  t.deepEquals(myEvent.toString(), eventData_.toString(), 'correctly implements .toString');
  
  
  t.test('without some attributes', function (tt) {
    var eventData_;
    
    eventData_ = _.cloneDeep(eventData);
    delete eventData_.title;
    tt.throws(function () { new EventModel.create(eventData_); }, 'throws if attribute was required but not specified in the constructor');
    
    eventData_ = _.cloneDeep(eventData);
    delete eventData_.abstract;
    var myEvent = new EventModel.create(eventData_);
    tt.equals(myEvent.abstract, modelConfig.abstract.defaultValue, 'uses default value');
    
    tt.throws(function () { delete myEvent.title; }, 'throws if attempting to delete a required one');
    tt.throws(function () { myEvent.title = undefined; }, 'throws if attempting to unset a required one');
    
    tt.doesNotThrow(function () { delete myEvent.abstract; }, 'does not throw if attempting to delete an optional one');
    tt.doesNotThrow(function () { myEvent.abstract = undefined; }, 'does not throw if attempting to unset an optional one');
    tt.equals(myEvent.abstract, modelConfig.abstract.defaultValue, 'and will get its default value');
    
    tt.end();
  });

});
  

/*
var myEvent = new EventModel.create({
  title: 'App launch',
  eventDate: new Date() - 1000 * 60 * 10, // 10 minutes ago
  eventDateHuman: 'Starting from 2.50pm today!',
  abstract: 'Launching my wonderful mobile application <3'
});

console.log('title is', myEvent.displayTitle());
myEvent.title = 'xyz!';
myEvent.save();

myEvent.abstract = 'lot of bars';
myEvent.save();

myEvent.title = 'bara';
myEvent.save();
*/

/*
var events = models.Event.find({ title: 'App launch' });
console.log('events', events);
*/



// Stuffs

function notBar(value) {
  return value !== 'bar';
}

