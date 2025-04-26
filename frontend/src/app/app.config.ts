import { provideRouter } from '@angular/router';
import { Routes } from '@angular/router';
import { InicioSesionComponent } from './componentes/inicio-sesion/inicio-sesion.component';
import { SolicitarCursoComponent } from './componentes/solicitar-curso/solicitar-curso.component';

const routes: Routes = [
  { path: '', component: InicioSesionComponent },
  { path: 'solicitar-curso', component: SolicitarCursoComponent },
];

export const appConfig = {
  providers: [provideRouter(routes)],
};
