import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private zone: NgZone, private location: Location, private router: Router, private authService: AuthService) {
    this.setupListener();
  }

  setupListener() {
    App.addListener('appUrlOpen', async (data: URLOpenListenerEvent) => {
      console.log('app opened with URL: ', data);

      const openUrl = data.url;
      // const slug = openUrl.split('login').pop();
      // const navigateUrl = `/groups${slug}`;
      // console.log('use url: ', navigateUrl);
      const access = openUrl.split('#access_token=').pop().split('&')[0];
      console.log('access: ', access);
      const refresh = openUrl.split('&refresh_token=').pop().split('&')[0];
      console.log('refresh: ', refresh);

      await this.authService.setSession(access, refresh);

      this.zone.run(() => {
        this.router.navigateByUrl('/groups', { replaceUrl: true });

        // this.location.replaceState(navigateUrl);
        // window.location.reload();
      });
    });
  }
}
