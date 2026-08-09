import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Carousel } from '../../components/carousel/carousel';

interface ArtworkPlaceholder {
  id: string;
  title: string;
  author: string;
  location: string;
  imageUrl: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Carousel],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  userName= signal<string>('John Doe') ;

  activeVisit = signal<ArtworkPlaceholder>({
    id: '123',
    title: 'Gamberetto allo spiedo',
    author: 'Gr8llo',
    location: 'Geologia G1',
    imageUrl: '/assets/images/place_holder.jpg'
  });

  /*activeVisit = signal<ArtworkPlaceholder | null>(null)*/

  recommendedExhibitions = [
    {
      id: 'ex-13',
      title: 'Luminous Geometry',
      subtitle: 'Contemporary Wing • Ends Oct 15',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATUzfoUX9jXXmlMerx1p9mheAOEJ9JEc0DBEaqGUksGseAU-CTR9K1XHYCysGfifRMPvSL71Necq7rv_TFM-fzXSxNo_L8DZWgNqAc4nBYJguBdPfFizQTwGQ4lemzdhlhhuOUW5UCEwy9JrAqM2kZu0FnqZvavbvyMSVcgz6Ab_-bFIC-3L2PssMMoPwrkMavGpUzWWIKEQuou8faaF0JTAtcULFG4H69WBMdFosNApHZkNqt2VAm',
      badge: 'In Chiusura',
      badgeType: 'accent'
    },
    {
      id: 'ex-16',
      title: 'Luminous Geometry',
      subtitle: 'Contemporary Wing • Ends Oct 15',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATUzfoUX9jXXmlMerx1p9mheAOEJ9JEc0DBEaqGUksGseAU-CTR9K1XHYCysGfifRMPvSL71Necq7rv_TFM-fzXSxNo_L8DZWgNqAc4nBYJguBdPfFizQTwGQ4lemzdhlhhuOUW5UCEwy9JrAqM2kZu0FnqZvavbvyMSVcgz6Ab_-bFIC-3L2PssMMoPwrkMavGpUzWWIKEQuou8faaF0JTAtcULFG4H69WBMdFosNApHZkNqt2VAm',
      badge: 'In Chiusura',
      badgeType: 'accent'
    },
    {
      id: 'ex-19',
      title: 'Luminous Geometry',
      subtitle: 'Contemporary Wing • Ends Oct 15',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATUzfoUX9jXXmlMerx1p9mheAOEJ9JEc0DBEaqGUksGseAU-CTR9K1XHYCysGfifRMPvSL71Necq7rv_TFM-fzXSxNo_L8DZWgNqAc4nBYJguBdPfFizQTwGQ4lemzdhlhhuOUW5UCEwy9JrAqM2kZu0FnqZvavbvyMSVcgz6Ab_-bFIC-3L2PssMMoPwrkMavGpUzWWIKEQuou8faaF0JTAtcULFG4H69WBMdFosNApHZkNqt2VAm',
      badge: 'In Chiusura',
      badgeType: 'accent'
    },
    {
      id: 'ex-157',
      title: 'Luminous Geometry',
      subtitle: 'Contemporary Wing • Ends Oct 15',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATUzfoUX9jXXmlMerx1p9mheAOEJ9JEc0DBEaqGUksGseAU-CTR9K1XHYCysGfifRMPvSL71Necq7rv_TFM-fzXSxNo_L8DZWgNqAc4nBYJguBdPfFizQTwGQ4lemzdhlhhuOUW5UCEwy9JrAqM2kZu0FnqZvavbvyMSVcgz6Ab_-bFIC-3L2PssMMoPwrkMavGpUzWWIKEQuou8faaF0JTAtcULFG4H69WBMdFosNApHZkNqt2VAm',
      badge: 'In Chiusura',
      badgeType: 'accent'
    },
    {
      id: 'ex-1',
      title: 'Luminous Geometry',
      subtitle: 'Contemporary Wing • Ends Oct 15',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATUzfoUX9jXXmlMerx1p9mheAOEJ9JEc0DBEaqGUksGseAU-CTR9K1XHYCysGfifRMPvSL71Necq7rv_TFM-fzXSxNo_L8DZWgNqAc4nBYJguBdPfFizQTwGQ4lemzdhlhhuOUW5UCEwy9JrAqM2kZu0FnqZvavbvyMSVcgz6Ab_-bFIC-3L2PssMMoPwrkMavGpUzWWIKEQuou8faaF0JTAtcULFG4H69WBMdFosNApHZkNqt2VAm',
      badge: 'In Chiusura',
      badgeType: 'accent'
    },
    {
      id: 'ex-2',
      title: 'Earth & Fire: Eastern Ceramics',
      subtitle: 'Asian Art Pavilion • Ongoing',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB92GJz0DCj50R5nSrG5_1QHW-iiakosTHX4HFqR9m2WgtlVn33iGOAa7gJfWMuGHKNhbimCozOA6gkz3oP_N9i5YPfK8B_w1w3V4kFGIaxiaEWKAkKCebU0CeGhbnxhIGQHhX17DuFjuhciUxLNyNpU-NsgqqEhftEKQ02CUKzDePr3A_Youflzd29okIp31JJiGpMBd2vxmpweIYY9_Z2li3o0layVRj5lAP4m-j-0894Js4Pd2Bg',
      badge: null
    },
    {
      id: 'ex-3',
      title: 'Urban Constructs',
      subtitle: 'Photography Gallery • Just Opened',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqCwZhDHtLcDdclzIA9u3gS6g_lfJvbYUadWIPnZkoDJ2wx6ARa_mOyaFOP4ddZOwTK1bESg3CHtJCUQFyN5Sr5mRceH2dbB_x0sk-1O_Mp4unNvMCulLCR8GHfZOmZuuUZbjtpVJURBEnE-UiFckXsrS-YfrJdBdfuqhJApVaHTSTuTVLIrnwN7envMt-8H7Iz1NNFXtrG2CfMNRkF2aQ3zNAruNW__dJWhubbs8QqWEJ3yvmukY4',
      badge: 'Nuovo Arrivo',
      badgeType: 'default'
    }
  ];
}
