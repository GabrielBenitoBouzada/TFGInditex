// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent }       from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter }      from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { routes }             from './app/app.routes';

// ngx-translate imports
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader }  from '@ngx-translate/http-loader';
import { HttpClient }           from '@angular/common/http';

// Factory para cargar los JSON de traducción desde assets/i18n/*.json
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    // HTTP client
    provideHttpClient(withInterceptorsFromDi()),
    // Router
    provideRouter(routes),
    // Animations (si las usas)
    importProvidersFrom(BrowserAnimationsModule),
    provideAnimations(),
    // ngx-translate
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
  // Una vez arranca la app, inicializamos el servicio de traducción
  const translate = appRef.injector.get(TranslateService);

  // Registramos los idiomas disponibles
  translate.addLangs(['es','en','fr','it','de']);
  // Idioma por defecto
  translate.setDefaultLang('es');

  // Cargamos el idioma guardado (o 'es' si no hay ninguno)
  const lang = localStorage.getItem('idioma') || 'es';
  translate.use(lang);
})
.catch(err => console.error(err));
