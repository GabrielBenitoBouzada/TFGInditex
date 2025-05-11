import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';

import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// ✅ Aplicamos accesibilidad antes de arrancar Angular
const usuarioStr = localStorage.getItem('usuario');
if (usuarioStr) {
  const usuario = JSON.parse(usuarioStr);
  const prefs = usuario.preferenciasAccesibilidad || {};

  if (prefs.altoContraste) document.body.classList.add('modo-contraste');
  if (prefs.tamanoLetra === 'grande') document.body.classList.add('letra-grande');
  else if (prefs.tamanoLetra === 'pequeno') document.body.classList.add('letra-pequena');
  if (prefs.lenguajeSencillo) document.body.classList.add('lenguaje-sencillo');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
    importProvidersFrom(BrowserAnimationsModule),
    provideAnimations(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
})
.then(appRef => {
  const translate = appRef.injector.get(TranslateService);
  translate.addLangs(['es', 'en', 'fr', 'it', 'de']);

  let lang = 'es';
  const usuarioStr = localStorage.getItem('usuario');
  if (usuarioStr) {
    const usuario = JSON.parse(usuarioStr);
    lang = usuario.idioma || usuario.idiomaPredeterminado || localStorage.getItem('idioma') || 'es';
  } else {
    lang = localStorage.getItem('idioma') || 'es';
  }

  translate.setDefaultLang(lang);
  translate.use(lang);
})
.catch(err => console.error(err));
