import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isActiveSearchLink: boolean = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.checkActiveLink();
    this.router.events.subscribe(() => {
      this.checkActiveLink();
    });
  }

  checkActiveLink() {
    const currentRoute = this.router.url;
    this.isActiveSearchLink = currentRoute.startsWith('/search');
  }
}