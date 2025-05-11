import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CursosService } from '../../servicios/cursos.service';

@Component({
  selector: 'app-cursos-recomendados',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './cursos-recomendados.component.html',
  styleUrls: ['./cursos-recomendados.component.css']
})
export class CursosRecomendadosComponent implements OnInit {
  cursos: any[] = [];
  mensaje = '';
  email = '';

  constructor(
    private cursosService: CursosService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const usr = localStorage.getItem('usuario');
    if (!usr) {
      this.mensaje = this.translate.instant('CURSOS_RECOMENDADOS.ERROR_NO_AUT');
      return;
    }
    const parsed = JSON.parse(usr);
    this.email = parsed.email;
    this.cargarRecomendados();
  }

  cargarRecomendados() {
    this.cursosService.obtenerCursosRecomendados(this.email).subscribe({
      next: data => {
        this.cursos = data.cursos || [];
        if (!this.cursos.length) {
          this.mensaje = this.translate.instant('CURSOS_RECOMENDADOS.NO_HAY');
        }
      },
      error: () => {
        this.mensaje = this.translate.instant('CURSOS_RECOMENDADOS.ERROR');
      }
    });
  }

  verCurso(curso: any) {
    this.router.navigate(['/home/curso', curso._id], {
      state: { recomendado: true }
    });
  }

  guardarCurso(curso: any) {
    this.cursosService.guardarCurso(this.email, curso).subscribe({
      next: () => {
        // ✅ Eliminar visualmente tras guardar
        this.cursos = this.cursos.filter(c => c._id !== curso._id);
      },
      error: () => {
        alert(this.translate.instant('CURSOS_RECOMENDADOS.ERROR_GUARDAR'));
      }
    });
  }
}
