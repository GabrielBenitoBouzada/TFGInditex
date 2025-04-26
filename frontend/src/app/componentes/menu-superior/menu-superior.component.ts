import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IdiomaService } from '../../servicios/idioma.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-menu-superior',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './menu-superior.component.html',
  styleUrls: ['./menu-superior.component.css']
})
export class MenuSuperiorComponent {
  constructor(
    private idiomaService: IdiomaService,
    private translate: TranslateService
  ) {}

  logout() {
    localStorage.clear();
    window.location.href = '/';
  }

  cambiarIdioma(idioma: string) {
    this.idiomaService.setIdioma(idioma);
    this.translate.use(idioma);
  }
}
