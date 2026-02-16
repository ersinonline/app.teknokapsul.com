import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAJvPHanRIOudEEyj3KA0hqM6G2VyIp_7E',
    appId: '1:488411585201:android:fbd1f0639f2f8351156090',
    messagingSenderId: '488411585201',
    projectId: 'superapp-37db4',
    storageBucket: 'superapp-37db4.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBR7KdmDdIkiHK4fVjiRGgwsgmn5ZVy9OI',
    appId: '1:488411585201:ios:4698c5cd3df2a6fc156090',
    messagingSenderId: '488411585201',
    projectId: 'superapp-37db4',
    storageBucket: 'superapp-37db4.appspot.com',
    androidClientId: '488411585201-1dr2ro6d0i0kpheg3bmlrf3bb7pjsr8k.apps.googleusercontent.com',
    iosClientId: '488411585201-4s2r093o29auo4mokcu5at7nlicblj6c.apps.googleusercontent.com',
    iosBundleId: 'com.teknotech.ekiraci',
  );

}