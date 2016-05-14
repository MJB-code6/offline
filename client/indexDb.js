//(function() {
//	var db;
//	
//	// started db
//	databaseOpen(function() {
//		console.log('Database Opened!');
//	})
//	
//	// opened db
//	function databaseOpen() {
//		var version = 1;
//		var request = indexedDB.open('test-db2', version);
//		
//		request.onupgradeneeded = function(event) {
//			db = event.target.result;
//			event.target.transaction.onerror = databaseError;
//			
//			// added store
//			db.createObjectStore('KeyValStore', {keyPath: 'timeStamp'});
//			
//			addToDb();
//		};
//		
//		// add items into store (why is db undefined??);
//		addToDb();
//		
//		var transaction = db.transaction(['KeyValStore'], 'readwrite');
//
//		console.log(transaction);
//		function addToDb() {
//			var store = transaction.objectStore('KeyValStore');
//			var request = store.add({
//				text : "hello",
//				timeStamp: Date.now(),
//		});
//
//			transaction.oncomplete = function(event) {
//			console.log('Added to keyValStore!')
//		}
//
//		request.onerror = ('addToDb', databaseError);
//		}
//	
//		
//		// if added successfully
//		request.onsuccess = function(event) {
//			console.log(event);
//			db = event.target.result;
//		};
//		// if not added successfully
//		request.onerror = ('Openerror', databaseError);
//	};
//	
//	// handles any errors
//	function databaseError(event) {
//		console.error("An indexedDB error has occured", event);
//	};
//	
//	// trying to add test items into store but get errors that db is undefined
//
//	
//	
//}());
//
//// Put this into console to delete database:
//// indexedDB.deleteDatabase('keyValStore');
//
///*
//
//Whenever you add or remove object stores, you will need to increment the version number. Otherwise, the structure of the data will be different from what your code expects, and you risk breaking the application.
//
//*/