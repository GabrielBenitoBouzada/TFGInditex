import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CursosService } from '../../servicios/cursos.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cursos-anteriores',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './cursos-anteriores.component.html',
  styleUrls: ['./cursos-anteriores.component.css'],
})
export class CursosAnterioresComponent {
  private cursosService = inject(CursosService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  cursos: any[] = [];
  cursosOriginales: any[] = [];
  mensaje: string = '';
  terminoBusqueda: string = '';

  ngOnInit() {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      this.mensaje = this.translate.instant('CURSOS_ANTERIORES.USUARIO_NO_AUT');
      return;
    }

    const email = JSON.parse(usuarioStr).email;

    this.cursosService.obtenerCursosDelUsuario(email).subscribe({
      next: (data) => {
        this.cursosOriginales = data.cursos || [];
        this.cursos = [...this.cursosOriginales];
        if (this.cursos.length === 0) {
          this.mensaje = this.translate.instant('CURSOS_ANTERIORES.NO_HAY');
        }
      },
      error: () => {
        this.mensaje = this.translate.instant('CURSOS_ANTERIORES.ERROR');
      }
    });
  }

  filtrarCursos() {
    const termino = this.terminoBusqueda.toLowerCase();
    this.cursos = this.cursosOriginales
      .map(curso => ({
        ...curso,
        _relevancia: this.calcularRelevancia(curso, termino)
      }))
      .filter(c => c._relevancia > 0)
      .sort((a, b) => b._relevancia - a._relevancia);
  }

  calcularRelevancia(curso: any, termino: string): number {
    let score = 0;
    if (curso.tituloCurso?.toLowerCase().includes(termino)) score += 2;
    if (curso.tema?.toLowerCase().includes(termino)) score += 1;
    if (curso.necesidades?.toLowerCase().includes(termino)) score += 1;
    return score;
  }

  verCurso(curso: any) {
    this.router.navigate(['/home/curso', curso._id]);
  }

  compartirCurso(curso: any) {
    console.log('Compartir curso:', curso);
  }
}