import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));

// Register the PWA service worker outside the Angular dev server so local
// development on port 4400 stays free of any caching layer.
if ('serviceWorker' in navigator && location.port !== '4400') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => undefined);
  });
}
