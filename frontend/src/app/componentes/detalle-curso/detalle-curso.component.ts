import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CursosService } from '../../servicios/cursos.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-detalle-curso',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './detalle-curso.component.html',
  styleUrls: ['./detalle-curso.component.css']
})
export class DetalleCursoComponent {
  private route = inject(ActivatedRoute);
  private cursosService = inject(CursosService);
  private translate = inject(TranslateService);

  curso: any = null;
  error: string = '';

  ngOnInit() {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      this.error = this.translate.instant('DETALLE_CURSO.ERROR_NO_AUT');
      return;
    }

    const email = JSON.parse(usuarioStr).email;
    const cursoId = this.route.snapshot.paramMap.get('id');

    if (!cursoId) {
      this.error = this.translate.instant('DETALLE_CURSO.ERROR_ID');
      return;
    }

    this.cursosService.obtenerCursoPorId(email, cursoId).subscribe({
      next: data => this.curso = data,
      error: () => {
        this.error = this.translate.instant('DETALLE_CURSO.ERROR_CARGAR');
      }
    });
  }
}
