// src/app/componentes/cursos-anteriores/cursos-anteriores.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CursosService } from '../../servicios/cursos.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cursos-anteriores',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './cursos-anteriores.component.html',
  styleUrls: ['./cursos-anteriores.component.css'],
})
export class CursosAnterioresComponent {
  private cursosService = inject(CursosService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  cursos: any[] = [];
  mensaje: string = '';

  ngOnInit() {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      this.mensaje = this.translate.instant('CURSOS_ANTERIORES.USUARIO_NO_AUT');
      return;
    }

    const email = JSON.parse(usuarioStr).email;

    this.cursosService.obtenerCursosDelUsuario(email).subscribe({
      next: (data) => {
        this.cursos = data.cursos || [];
        if (this.cursos.length === 0) {
          this.mensaje = this.translate.instant('CURSOS_ANTERIORES.NO_HAY');
        }
      },
      error: () => {
        this.mensaje = this.translate.instant('CURSOS_ANTERIORES.ERROR');
      }
    });
  }

  verCurso(curso: any) {
    this.router.navigate(['/home/curso', curso._id]);
  }
}
