import { Component, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IdiomaService } from '../../servicios/idioma.service';

@Component({
  selector: 'app-menu-superior',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './menu-superior.component.html',
  styleUrls: ['./menu-superior.component.css']
})
export class MenuSuperiorComponent {
  mostrarDropdown = false;

  constructor(
    private idiomaService: IdiomaService,
    private translate: TranslateService,
    private router: Router,
    private el: ElementRef
  ) {}

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  @HostListener('document:click', ['$event'])
  cerrarDropdownSiClicFuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.derecha')) {
      this.mostrarDropdown = false;
    }
  }

  logout() {
    localStorage.clear();
    window.location.href = '/';
  }

  irAMiEspacio() {
    this.router.navigate(['/home/solicitar']);
    this.mostrarDropdown = false;
  }

  irAConfiguracion() {
    this.router.navigate(['/home/configuracion']);
    this.mostrarDropdown = false;
  }

  cambiarIdioma(idioma: string) {
    this.idiomaService.setIdioma(idioma);
    this.translate.use(idioma);
  }
}
