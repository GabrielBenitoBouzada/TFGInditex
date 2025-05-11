import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../servicios/usuario.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IdiomaService } from '../../servicios/idioma.service';

@Component({
  selector: 'app-configuracion-perfil',
  standalone: true,
  templateUrl: './configuracion-perfil.component.html',
  styleUrls: ['./configuracion-perfil.component.css'],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule]
})
export class ConfiguracionPerfilComponent implements OnInit {
  formulario!: FormGroup;
  nombreUsuario: string = '';
  emailUsuario: string = '';
  rol: string = '';
  subrol: string = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private translate: TranslateService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    const usrStr = localStorage.getItem('usuario');
    const usr = usrStr ? JSON.parse(usrStr) : null;
    if (!usr) return;

    this.emailUsuario = usr.email;

    this.formulario = this.fb.group({
      idioma: ['es'],
      lenguajeSencillo: [false],
      altoContraste: [false],
      tamanoLetra: ['normal']
    });

    this.usuarioService.obtenerUsuario(this.emailUsuario).subscribe({
      next: (usuario) => {
        this.nombreUsuario = usuario.nombre;
        this.rol = usuario.rol;
        this.subrol = usuario.subrol;

        const idioma = usuario.idioma || usuario.idiomaPredeterminado || 'es';

        this.formulario.patchValue({
          idioma,
          lenguajeSencillo: usuario.preferenciasAccesibilidad?.lenguajeSencillo || false,
          altoContraste: usuario.preferenciasAccesibilidad?.altoContraste || false,
          tamanoLetra: usuario.preferenciasAccesibilidad?.tamanoLetra || 'normal'
        });

        this.translate.use(idioma);
        this.idiomaService.setIdioma(idioma);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.aplicarAccesibilidad();
      },
      error: () => alert('❌ No se pudo cargar la configuración del usuario.')
    });
  }

  guardar(): void {
    const idioma = this.formulario.get('idioma')?.value;
    const accesibilidad = {
      lenguajeSencillo: this.formulario.get('lenguajeSencillo')?.value,
      altoContraste: this.formulario.get('altoContraste')?.value,
      tamanoLetra: this.formulario.get('tamanoLetra')?.value
    };

    this.usuarioService.actualizarPerfil(this.emailUsuario, {
      idiomaPredeterminado: idioma,
      preferenciasAccesibilidad: accesibilidad
    }).subscribe({
      next: () => {
        alert('✅ Cambios guardados correctamente.');
        this.translate.use(idioma);
        this.idiomaService.setIdioma(idioma);

        const updatedUser = {
          email: this.emailUsuario,
          nombre: this.nombreUsuario,
          rol: this.rol,
          subrol: this.subrol,
          idiomaPredeterminado: idioma,
          preferenciasAccesibilidad: accesibilidad
        };

        localStorage.setItem('usuario', JSON.stringify(updatedUser));
        localStorage.setItem('idioma', idioma);

        this.aplicarAccesibilidad();
      },
      error: () => alert('❌ Error al guardar el perfil.')
    });
  }

  aplicarAccesibilidad(): void {
    const body = document.body;
    body.classList.remove('alto-contraste', 'letra-grande', 'letra-pequena', 'letra-normal', 'lenguaje-sencillo');

    const ac = this.formulario.value;

    if (ac.altoContraste) {
      body.classList.add('alto-contraste');
    }

    if (ac.lenguajeSencillo) {
      body.classList.add('lenguaje-sencillo');
    }

    switch (ac.tamanoLetra) {
      case 'grande':
        body.classList.add('letra-grande');
        break;
      case 'pequena':
        body.classList.add('letra-pequena');
        break;
      default:
        body.classList.add('letra-normal');
    }
  }
}
