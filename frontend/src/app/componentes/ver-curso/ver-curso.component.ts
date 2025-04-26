import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ver-curso',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './ver-curso.component.html',
  styleUrls: ['./ver-curso.component.css']
})
export class VerCursoComponent {
  curso: any = null;
  private router = inject(Router);

  ngOnInit() {
    const storedCurso = sessionStorage.getItem('cursoGenerado');
    if (storedCurso) {
      this.curso = JSON.parse(storedCurso);
    } else {
      this.router.navigate(['/home/solicitar']);
    }
  }
}
