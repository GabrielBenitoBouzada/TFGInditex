// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { InicioSesionComponent }    from './componentes/inicio-sesion/inicio-sesion.component';
import { MenuSuperiorComponent }    from './componentes/menu-superior/menu-superior.component';
import { SolicitarCursoComponent }  from './componentes/solicitar-curso/solicitar-curso.component';
import { CursosAnterioresComponent} from './componentes/cursos-anteriores/cursos-anteriores.component';
import { DetalleCursoComponent }    from './componentes/detalle-curso/detalle-curso.component';
import { ConfiguracionPerfilComponent } from './componentes/configuracion-perfil/configuracion-perfil.component';

export const routes: Routes = [
  { path: '', component: InicioSesionComponent },
  {
    path: 'home',
    component: MenuSuperiorComponent,
    children: [
      { path: 'solicitar', component: SolicitarCursoComponent },
      { path: 'cursos',    component: CursosAnterioresComponent },
      { path: 'curso/:id', component: DetalleCursoComponent },
      { path: 'configuracion', component: ConfiguracionPerfilComponent }, // ← CORRECTO
      { path: '', redirectTo: 'solicitar', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
