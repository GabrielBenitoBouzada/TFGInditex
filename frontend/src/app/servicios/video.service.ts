import { Injectable } from '@angular/core';
import { HttpClient }     from '@angular/common/http';
import { Observable }     from 'rxjs';

export interface StatusResp {
  status:   'in_progress'|'completed'|'failed';
  videoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private base = 'http://127.0.0.1:8000/synthesia';
  constructor(private http: HttpClient) {}

  status(videoId: string): Observable<StatusResp> {
    return this.http.get<StatusResp>(`${this.base}/status/${videoId}`);
  }
}
